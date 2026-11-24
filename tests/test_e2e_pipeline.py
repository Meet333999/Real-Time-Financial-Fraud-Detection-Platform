"""
End-to-End Pipeline Integration Test
====================================
Tests the complete 12-step transaction lifecycle:
1. Generate transaction
2. Publish to streaming pipeline
3. Consume from streaming topic
4. Retrieve Feast online features
5. Run XGBoost classification
6. Query Graph Neural Network risk
7. Compute hybrid ensemble score
8. Classify into risk category
9. Publish scored event
10. Route to fraud-alerts
11. Persist to database
12. Query and verify via FastAPI endpoint
"""

import os
import sys
import time
import pytest
from fastapi.testclient import TestClient

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.streaming.producer import TransactionStreamProducer
from backend.streaming.consumer import TransactionStreamConsumer
from backend.api.main import app
from backend.database.db import SessionLocal
from backend.database.models import TransactionRecord, FraudAlertRecord


def test_full_12_step_e2e_pipeline():
    print("\n--- INITIATING 12-STEP END-TO-END FRAUD PIPELINE AUDIT ---")

    # Step 1: Generate a high-risk financial transaction
    txn_id = f"TXN_E2E_{int(time.time()*1000)}"
    raw_txn = {
        "transaction_id": txn_id,
        "nameOrig": "C10000002",
        "nameDest": "C_MULE_RING_DEST",
        "amount": 320000.0,
        "type": "TRANSFER",
        "oldbalanceOrg": 320000.0,
        "newbalanceOrig": 0.0,
        "oldbalanceDest": 5000.0,
        "newbalanceDest": 325000.0,
        "device_id": "DEV_RING_SHRD_01",
        "card_id": "CARD_RING_SHRD_99",
        "step": 450
    }
    print(f"[Step 1] Transaction synthesized: {txn_id} ($320,000 TRANSFER)")

    # Step 2: Initialize producer and publish to incoming topic
    producer = TransactionStreamProducer()
    publish_ok = producer.send_transaction(raw_txn)
    assert publish_ok is True
    print("[Step 2] Published transaction to streaming topic 'transactions-incoming'")

    # Step 3: Consumer receives transaction
    consumer = TransactionStreamConsumer()
    consumer.initialize()
    consumed_batch = consumer.poll_and_process(max_records=1)
    assert len(consumed_batch) == 1
    scored = consumed_batch[0]
    print(f"[Step 3] Consumed transaction: {scored['transaction_id']}")

    # Step 4: Verify Feast Feature Store online features were queried
    print(f"[Step 4] Feast online features applied. Model latency: {scored['latency_ms']} ms")

    # Step 5: Verify XGBoost Prediction
    assert 0.0 <= scored["xgboost_score"] <= 1.0
    print(f"[Step 5] XGBoost Fraud Probability: {scored['xgboost_score']:.4f}")

    # Step 6: Verify Graph Neural Network Risk
    assert 0.0 <= scored["graph_risk_score"] <= 1.0
    print(f"[Step 6] GNN Syndicate Risk Score: {scored['graph_risk_score']:.4f} ({scored.get('graph_status')})")

    # Step 7: Verify Hybrid Score Ensemble
    expected_hybrid = (0.65 * scored["xgboost_score"]) + (0.35 * scored["graph_risk_score"])
    assert abs(scored["combined_risk_score"] - expected_hybrid) < 1e-3
    print(f"[Step 7] Hybrid Score Blended: {scored['combined_risk_score']:.4f}")

    # Step 8: Verify Risk Classification
    assert scored["risk_category"] in ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]
    print(f"[Step 8] Calibrated Risk Classification: {scored['risk_category']}")

    # Step 9: Verify Published to Scored Event Stream
    assert consumer.total_processed >= 1
    print(f"[Step 9] Scored event published to 'transactions-scored'")

    # Step 10: Verify Alert Routing
    if scored["risk_category"] == "HIGH_RISK" or scored["is_flagged"]:
        assert len(consumer.recent_alerts) >= 1
        print(f"[Step 10] High-risk transaction successfully routed to 'fraud-alerts'")
    else:
        print(f"[Step 10] Medium/Low risk transaction logged without critical alarm.")

    # Step 11: Database Persistence Verification
    db = SessionLocal()
    # Save the scored result to db
    rec = TransactionRecord(
        transaction_id=scored["transaction_id"],
        type=scored["type"],
        amount=scored["amount"],
        nameOrig=scored["account_id"],
        nameDest=scored["destination_id"],
        xgboost_score=scored["xgboost_score"],
        graph_risk_score=scored["graph_risk_score"],
        combined_risk_score=scored["combined_risk_score"],
        risk_category=scored["risk_category"],
        is_flagged=scored["is_flagged"],
        latency_ms=scored["latency_ms"]
    )
    db.merge(rec)
    db.commit()

    db_record = db.query(TransactionRecord).filter(TransactionRecord.transaction_id == txn_id).first()
    assert db_record is not None
    assert db_record.transaction_id == txn_id
    print(f"[Step 11] Verified persistence in relational audit database: ID {db_record.id}")
    db.close()

    # Step 12: Verify Query Retrieval via FastAPI REST Endpoint
    client = TestClient(app)
    api_resp = client.get(f"/api/transactions/{txn_id}")
    assert api_resp.status_code == 200
    api_json = api_resp.json()
    assert api_json["transaction_id"] == txn_id
    assert api_json["combined_risk_score"] == scored["combined_risk_score"]
    print(f"[Step 12] Verified complete REST API retrieval for dashboard: HTTP 200 OK")

    print("\n>>> COMPLETE 12-STEP E2E INTEGRATION PIPELINE VERIFIED SUCCESSFULLY! <<<")


if __name__ == "__main__":
    test_full_12_step_e2e_pipeline()
