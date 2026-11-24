"""
SQLAlchemy Database Models for Fraud Detection Platform
======================================================
Stores transactions, fraud alerts, investigation cases, and drift logs.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    JSON,
    ForeignKey
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class TransactionRecord(Base):
    """Historical and real-time scored financial transactions."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(String(64), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    step = Column(Integer, default=1)
    type = Column(String(32), default="TRANSFER", index=True)
    amount = Column(Float, nullable=False)
    nameOrig = Column(String(64), index=True, nullable=False)
    nameDest = Column(String(64), index=True, nullable=False)
    device_id = Column(String(64), index=True, default="UNKNOWN")
    card_id = Column(String(64), index=True, default="UNKNOWN")

    # Scoring Results
    xgboost_score = Column(Float, default=0.0)
    graph_risk_score = Column(Float, default=0.0)
    combined_risk_score = Column(Float, index=True, default=0.0)
    risk_category = Column(String(32), index=True, default="LOW_RISK")  # LOW_RISK, MEDIUM_RISK, HIGH_RISK
    is_flagged = Column(Boolean, default=False, index=True)
    latency_ms = Column(Float, default=0.0)
    contributing_features = Column(JSON, default=list)

    # Relationships
    alerts = relationship("FraudAlertRecord", back_populates="transaction", cascade="all, delete-orphan")
    cases = relationship("InvestigationCaseRecord", back_populates="transaction", cascade="all, delete-orphan")


class FraudAlertRecord(Base):
    """Suspicious alerts generated from high-risk scoring events."""
    __tablename__ = "fraud_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alert_id = Column(String(64), unique=True, index=True, nullable=False)
    transaction_id = Column(String(64), ForeignKey("transactions.transaction_id"), index=True, nullable=False)
    account_id = Column(String(64), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    combined_risk_score = Column(Float, nullable=False)
    severity = Column(String(32), default="HIGH", index=True)  # HIGH, MEDIUM, CRITICAL
    status = Column(String(32), default="OPEN", index=True)    # OPEN, UNDER_REVIEW, RESOLVED
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text, default="")
    contributing_features = Column(JSON, default=list)

    transaction = relationship("TransactionRecord", back_populates="alerts")


class InvestigationCaseRecord(Base):
    """Analyst investigation case for confirmed fraud or false positive audit."""
    __tablename__ = "investigation_cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(String(64), unique=True, index=True, nullable=False)
    transaction_id = Column(String(64), ForeignKey("transactions.transaction_id"), index=True, nullable=False)
    account_id = Column(String(64), index=True, nullable=False)
    risk_score = Column(Float, nullable=False)
    status = Column(String(32), default="OPEN", index=True)
    # Statuses: OPEN, UNDER_REVIEW, CONFIRMED_FRAUD, FALSE_POSITIVE, RESOLVED
    notes = Column(Text, default="")
    evidence = Column(JSON, default=dict)
    assigned_analyst = Column(String(64), default="Analyst-1")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transaction = relationship("TransactionRecord", back_populates="cases")


class DriftLogRecord(Base):
    """Evidently AI drift monitoring audit records."""
    __tablename__ = "drift_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(64), unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    dataset_drift_detected = Column(Boolean, default=False)
    drift_share = Column(Float, default=0.0)
    drifted_features = Column(JSON, default=list)
    html_report_path = Column(String(256), default="")
    retraining_triggered = Column(Boolean, default=False)
