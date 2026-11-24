"""
Pydantic Schemas for Fraud Detection API
========================================
Validates requests and responses across all platform endpoints.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class RiskCategory(str, Enum):
    LOW_RISK = "LOW_RISK"
    MEDIUM_RISK = "MEDIUM_RISK"
    HIGH_RISK = "HIGH_RISK"


class CaseStatus(str, Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    CONFIRMED_FRAUD = "CONFIRMED_FRAUD"
    FALSE_POSITIVE = "FALSE_POSITIVE"
    RESOLVED = "RESOLVED"


class TransactionScoreRequest(BaseModel):
    transaction_id: Optional[str] = Field(None, example="TXN_100234")
    nameOrig: str = Field(..., example="C10000001", description="Sender Account ID")
    nameDest: str = Field(..., example="M20000001", description="Recipient Account/Merchant ID")
    amount: float = Field(..., gt=0.0, example=250.50, description="Transaction Amount")
    type: str = Field("TRANSFER", example="TRANSFER", description="Transaction type")
    oldbalanceOrg: Optional[float] = Field(0.0, example=5000.0)
    newbalanceOrig: Optional[float] = Field(0.0, example=4749.50)
    oldbalanceDest: Optional[float] = Field(0.0, example=12000.0)
    newbalanceDest: Optional[float] = Field(0.0, example=12250.50)
    device_id: Optional[str] = Field("DEV_100001", example="DEV_100001")
    card_id: Optional[str] = Field("CARD_1000000001", example="CARD_1000000001")
    location: Optional[str] = Field("New York", example="New York")
    ip_address: Optional[str] = Field("192.168.1.1", example="192.168.1.1")


class ContributingFeature(BaseModel):
    feature: str
    value: float
    global_importance: float
    risk_contribution: float


class TransactionScoreResponse(BaseModel):
    transaction_id: str
    account_id: str
    destination_id: str
    amount: float
    type: str
    xgboost_score: float
    graph_risk_score: float
    combined_risk_score: float
    risk_category: RiskCategory
    is_flagged: bool
    latency_ms: float
    contributing_features: List[ContributingFeature]
    model_version: str
    timestamp: str


class AlertResponse(BaseModel):
    alert_id: str
    transaction_id: str
    account_id: str
    amount: float
    combined_risk_score: float
    severity: str
    status: str
    timestamp: str
    notes: Optional[str] = ""
    contributing_features: Optional[List[Dict[str, Any]]] = []


class CaseResponse(BaseModel):
    case_id: str
    transaction_id: str
    account_id: str
    risk_score: float
    status: CaseStatus
    notes: Optional[str] = ""
    evidence: Optional[Dict[str, Any]] = {}
    assigned_analyst: str
    created_at: str
    updated_at: str


class CaseReviewRequest(BaseModel):
    status: CaseStatus
    notes: Optional[str] = ""
    analyst_name: Optional[str] = "Lead Analyst"


class AnalyticsOverview(BaseModel):
    total_transactions: int
    flagged_transactions: int
    high_risk_transactions: int
    medium_risk_transactions: int
    low_risk_transactions: int
    confirmed_fraud_cases: int
    false_positives: int
    fraud_detection_rate: float
    avg_processing_latency_ms: float
    p95_processing_latency_ms: float


class ModelMetricsResponse(BaseModel):
    model_name: str
    optimal_threshold: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    true_positives: int
    false_positives: int
    true_negatives: int
    false_negatives: int
    top_features: Dict[str, float]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    xgboost_status: str
    graph_model_status: str
    kafka_status: str
    feast_status: str
    database_status: str
    version: str
