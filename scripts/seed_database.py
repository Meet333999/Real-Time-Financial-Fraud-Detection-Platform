"""
Database Seeding Script
=======================
Scores a sample of test transactions to populate historical database records,
alerts, and investigation cases for instant analyst dashboard availability.
"""

import os
import sys
import logging
import pandas as pd

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database.db import init_db, SessionLocal
from backend.database.models import TransactionRecord, FraudAlertRecord, InvestigationCaseRecord
from backend.models.hybrid_scoring import HybridFraudScorer
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def seed_db(num_records: int = 120):
    init_db()
    db = SessionLocal()

    count = db.query(TransactionRecord).count()
    if count >= num_records:
        logger.info(f"Database already contains {count} transaction records.")
        db.close()
        return

    logger.info(f"Seeding database with {num_records} scored transactions...")
    test_path = os.path.join(ROOT_DIR, "data", "processed", "test.parquet")
    df = pd.read_parquet(test_path).head(num_records)

    scorer = HybridFraudScorer()
    scorer.initialize()

    base_time = datetime.utcnow() - timedelta(hours=6)

    for i, (_, row) in enumerate(df.iterrows()):
        raw = row.to_dict()
        res = scorer.score_transaction(raw)
        txn_time = base_time + timedelta(minutes=i * 3)

        rec = TransactionRecord(
            transaction_id=res["transaction_id"],
            timestamp=txn_time,
            step=int(raw.get("step", 1)),
            type=res["type"],
            amount=res["amount"],
            nameOrig=res["account_id"],
            nameDest=res["destination_id"],
            device_id=str(raw.get("device_id", "UNKNOWN")),
            card_id=str(raw.get("card_id", "UNKNOWN")),
            xgboost_score=res["xgboost_score"],
            graph_risk_score=res["graph_risk_score"],
            combined_risk_score=res["combined_risk_score"],
            risk_category=res["risk_category"],
            is_flagged=res["is_flagged"],
            latency_ms=res["latency_ms"],
            contributing_features=res["contributing_features"]
        )
        db.merge(rec)

        if res["is_flagged"] or res["risk_category"] == "HIGH_RISK":
            alert_id = f"ALT_{int(txn_time.timestamp())}_{i}"
            case_id = f"CASE_{int(txn_time.timestamp())}_{i}"

            alert = FraudAlertRecord(
                alert_id=alert_id,
                transaction_id=res["transaction_id"],
                account_id=res["account_id"],
                amount=res["amount"],
                combined_risk_score=res["combined_risk_score"],
                severity="HIGH",
                status="OPEN" if i % 2 == 0 else "RESOLVED",
                timestamp=txn_time,
                contributing_features=res["contributing_features"]
            )
            db.merge(alert)

            status = "CONFIRMED_FRAUD" if i % 4 == 0 else ("OPEN" if i % 2 == 0 else "UNDER_REVIEW")
            case = InvestigationCaseRecord(
                case_id=case_id,
                transaction_id=res["transaction_id"],
                account_id=res["account_id"],
                risk_score=res["combined_risk_score"],
                status=status,
                notes=f"Flagged by Hybrid Engine with score {res['combined_risk_score']:.3f}",
                evidence={"amount": res["amount"], "contributing_features": res["contributing_features"]},
                assigned_analyst=f"Analyst-{(i % 3) + 1}",
                created_at=txn_time,
                updated_at=txn_time
            )
            db.merge(case)

    db.commit()
    logger.info(f"Database seeded successfully with {db.query(TransactionRecord).count()} records and {db.query(FraudAlertRecord).count()} alerts.")
    db.close()


if __name__ == "__main__":
    seed_db()
