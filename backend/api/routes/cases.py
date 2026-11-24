"""
Analyst Investigation Cases Routes
==================================
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import InvestigationCaseRecord, FraudAlertRecord
from backend.api.schemas.transaction_schemas import CaseResponse, CaseReviewRequest, CaseStatus

router = APIRouter(tags=["Cases"])


@router.get("/cases")
def list_investigation_cases(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List fraud investigation cases for analyst workflow."""
    query = db.query(InvestigationCaseRecord)
    if status:
        query = query.filter(InvestigationCaseRecord.status == status.upper())

    total = query.count()
    records = query.order_by(InvestigationCaseRecord.id.desc()).offset(offset).limit(limit).all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "cases": [
            {
                "case_id": r.case_id,
                "transaction_id": r.transaction_id,
                "account_id": r.account_id,
                "risk_score": r.risk_score,
                "status": r.status,
                "notes": r.notes,
                "evidence": r.evidence,
                "assigned_analyst": r.assigned_analyst,
                "created_at": r.created_at.isoformat() if r.created_at else "",
                "updated_at": r.updated_at.isoformat() if r.updated_at else ""
            }
            for r in records
        ]
    }


@router.post("/cases/{case_id}/review")
def review_case(
    case_id: str,
    payload: CaseReviewRequest,
    db: Session = Depends(get_db)
):
    """Update case status (CONFIRMED_FRAUD, FALSE_POSITIVE, UNDER_REVIEW, RESOLVED) and add notes."""
    case = db.query(InvestigationCaseRecord).filter(InvestigationCaseRecord.case_id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    case.status = payload.status.value
    if payload.notes:
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        case.notes = f"{case.notes}\n[{timestamp_str} - {payload.analyst_name}]: {payload.notes}".strip()
    case.updated_at = datetime.utcnow()

    # Synchronize associated alert status if resolved
    alert = db.query(FraudAlertRecord).filter(FraudAlertRecord.transaction_id == case.transaction_id).first()
    if alert:
        if payload.status in [CaseStatus.CONFIRMED_FRAUD, CaseStatus.FALSE_POSITIVE, CaseStatus.RESOLVED]:
            alert.status = "RESOLVED"
        elif payload.status == CaseStatus.UNDER_REVIEW:
            alert.status = "UNDER_REVIEW"

    db.commit()

    return {
        "case_id": case.case_id,
        "status": case.status,
        "notes": case.notes,
        "assigned_analyst": case.assigned_analyst,
        "updated_at": case.updated_at.isoformat()
    }
