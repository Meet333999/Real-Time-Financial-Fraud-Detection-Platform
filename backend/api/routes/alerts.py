"""
Fraud Alerts Routes
====================
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import FraudAlertRecord

router = APIRouter(tags=["Alerts"])


@router.get("/alerts")
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve suspicious fraud alerts with severity and status filters."""
    query = db.query(FraudAlertRecord)
    if status:
        query = query.filter(FraudAlertRecord.status == status.upper())
    if severity:
        query = query.filter(FraudAlertRecord.severity == severity.upper())

    total = query.count()
    records = query.order_by(FraudAlertRecord.id.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "alerts": [
            {
                "alert_id": r.alert_id,
                "transaction_id": r.transaction_id,
                "account_id": r.account_id,
                "amount": r.amount,
                "combined_risk_score": r.combined_risk_score,
                "severity": r.severity,
                "status": r.status,
                "timestamp": r.timestamp.isoformat() if r.timestamp else "",
                "notes": r.notes,
                "contributing_features": r.contributing_features
            }
            for r in records
        ]
    }
