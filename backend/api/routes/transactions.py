"""
Transaction Scoring and Query Routes
====================================
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import TransactionRecord, FraudAlertRecord, InvestigationCaseRecord
from backend.api.schemas.transaction_schemas import (
    TransactionScoreRequest,
    TransactionScoreResponse,
    RiskCategory
)
from backend.models.hybrid_scoring import HybridFraudScorer

router = APIRouter(tags=["Transactions"])
scorer = HybridFraudScorer()
scorer.initialize()


@router.post("/transactions/score", response_model=TransactionScoreResponse)
def score_single_transaction(
    txn: TransactionScoreRequest,
    db: Session = Depends(get_db)
):
    """
    Score incoming financial transaction in real-time.
    Runs XGBoost, queries Graph Risk, computes blended risk score, and persists records.
    """
    raw_payload = txn.model_dump()
    result = scorer.score_transaction(raw_payload)

    # Persist in Database
    txn_record = TransactionRecord(
        transaction_id=result["transaction_id"],
        timestamp=datetime.utcnow(),
        step=raw_payload.get("step", 1),
        type=result["type"],
        amount=result["amount"],
        nameOrig=result["account_id"],
        nameDest=result["destination_id"],
        device_id=raw_payload.get("device_id", "UNKNOWN"),
        card_id=raw_payload.get("card_id", "UNKNOWN"),
        xgboost_score=result["xgboost_score"],
        graph_risk_score=result["graph_risk_score"],
        combined_risk_score=result["combined_risk_score"],
        risk_category=result["risk_category"],
        is_flagged=result["is_flagged"],
        latency_ms=result["latency_ms"],
        contributing_features=result["contributing_features"]
    )
    db.merge(txn_record)

    # If HIGH_RISK, create Fraud Alert and Investigation Case
    if result["is_flagged"] or result["risk_category"] == "HIGH_RISK":
        alert_id = f"ALT_{int(datetime.utcnow().timestamp()*1000)}"
        case_id = f"CASE_{int(datetime.utcnow().timestamp()*1000)}"

        alert = FraudAlertRecord(
            alert_id=alert_id,
            transaction_id=result["transaction_id"],
            account_id=result["account_id"],
            amount=result["amount"],
            combined_risk_score=result["combined_risk_score"],
            severity="HIGH",
            status="OPEN",
            timestamp=datetime.utcnow(),
            contributing_features=result["contributing_features"]
        )
        db.merge(alert)

        case = InvestigationCaseRecord(
            case_id=case_id,
            transaction_id=result["transaction_id"],
            account_id=result["account_id"],
            risk_score=result["combined_risk_score"],
            status="OPEN",
            notes=f"Flagged by Hybrid AI Engine: Combined score {result['combined_risk_score']:.4f}",
            evidence={"contributing_features": result["contributing_features"], "amount": result["amount"]},
            assigned_analyst="AI Triage"
        )
        db.merge(case)

    db.commit()

    return TransactionScoreResponse(
        transaction_id=result["transaction_id"],
        account_id=result["account_id"],
        destination_id=result["destination_id"],
        amount=result["amount"],
        type=result["type"],
        xgboost_score=result["xgboost_score"],
        graph_risk_score=result["graph_risk_score"],
        combined_risk_score=result["combined_risk_score"],
        risk_category=RiskCategory(result["risk_category"]),
        is_flagged=result["is_flagged"],
        latency_ms=result["latency_ms"],
        contributing_features=result["contributing_features"],
        model_version=result["model_version"],
        timestamp=result["timestamp"]
    )


@router.get("/transactions")
def list_transactions(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    risk_category: Optional[str] = None,
    txn_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve historical and live transactions with pagination and risk filtering."""
    query = db.query(TransactionRecord)
    if risk_category:
        query = query.filter(TransactionRecord.risk_category == risk_category.upper())
    if txn_type:
        query = query.filter(TransactionRecord.type == txn_type.upper())

    total = query.count()
    records = query.order_by(TransactionRecord.id.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "transactions": [
            {
                "transaction_id": r.transaction_id,
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
                "type": r.type,
                "amount": r.amount,
                "nameOrig": r.nameOrig,
                "nameDest": r.nameDest,
                "device_id": r.device_id,
                "card_id": r.card_id,
                "xgboost_score": r.xgboost_score,
                "graph_risk_score": r.graph_risk_score,
                "combined_risk_score": r.combined_risk_score,
                "risk_category": r.risk_category,
                "is_flagged": r.is_flagged,
                "latency_ms": r.latency_ms,
                "contributing_features": r.contributing_features
            }
            for r in records
        ]
    }


@router.get("/transactions/{transaction_id}")
def get_transaction_details(transaction_id: str, db: Session = Depends(get_db)):
    """Retrieve complete scoring and investigation details for a specific transaction."""
    record = db.query(TransactionRecord).filter(TransactionRecord.transaction_id == transaction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")

    return {
        "transaction_id": record.transaction_id,
        "timestamp": record.timestamp.isoformat() if record.timestamp else "",
        "type": record.type,
        "amount": record.amount,
        "nameOrig": record.nameOrig,
        "nameDest": record.nameDest,
        "device_id": record.device_id,
        "card_id": record.card_id,
        "xgboost_score": record.xgboost_score,
        "graph_risk_score": record.graph_risk_score,
        "combined_risk_score": record.combined_risk_score,
        "risk_category": record.risk_category,
        "is_flagged": record.is_flagged,
        "latency_ms": record.latency_ms,
        "contributing_features": record.contributing_features
    }
