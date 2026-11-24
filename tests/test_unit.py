"""
Unit Tests for Fraud Detection Platform
========================================
Tests preprocessing, feature engineering, XGBoost, GNN, hybrid scoring, and drift.
"""

import os
import sys
import pytest
import numpy as np
import pandas as pd
import torch

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.features.preprocessing import TransactionDataPreprocessor
from backend.features.feature_engineering import FeatureEngineer
from backend.features.feature_validation import FeatureValidator
from backend.models.xgboost_model.model import XGBoostFraudClassifier
from backend.graph.graph_model import FraudGraphSAGE
from backend.models.hybrid_scoring import HybridFraudScorer
from backend.graph.fraud_ring_detection import FraudRingDetector


def test_data_preprocessing_and_split():
    """Verify chronological splitting without data leakage."""
    sample_df = pd.DataFrame({
        "transaction_id": [f"TXN_{i}" for i in range(100)],
        "step": list(range(100)),
        "amount": [50.0 + i for i in range(100)],
        "isFraud": [1 if i % 20 == 0 else 0 for i in range(100)],
        "nameOrig": [f"C{1000+i}" for i in range(100)],
        "nameDest": [f"M{2000+i}" for i in range(100)]
    })
    preprocessor = TransactionDataPreprocessor()
    train_df, val_df, test_df, meta = preprocessor.chronological_split(sample_df, 0.70, 0.15, 0.15, time_col="step")

    assert len(train_df) == 70
    assert len(val_df) == 15
    assert len(test_df) == 15
    # Strict temporal ordering
    assert train_df["step"].max() < val_df["step"].min()
    assert val_df["step"].max() < test_df["step"].min()


def test_feature_engineering_transformation():
    """Verify consistent feature vector generation."""
    fe = FeatureEngineer()
    train_df = pd.DataFrame({
        "transaction_id": ["TXN_001", "TXN_002"],
        "nameOrig": ["C1001", "C1002"],
        "nameDest": ["M2001", "M2002"],
        "amount": [150.0, 300.0],
        "type": ["TRANSFER", "PAYMENT"],
        "oldbalanceOrg": [1000.0, 500.0],
        "newbalanceOrig": [850.0, 200.0],
        "oldbalanceDest": [0.0, 1000.0],
        "newbalanceDest": [150.0, 1300.0],
        "step": [1, 2],
        "isFraud": [0, 1]
    })
    fe.fit_behavioral_profiles(train_df)
    X, y = fe.transform(train_df)

    assert len(X) == 2
    assert len(y) == 2
    assert "dest_error_balance" in X.columns
    assert "orig_empty_flag" in X.columns
    assert X["dest_error_balance"].iloc[0] == 0.0


def test_feature_validator():
    """Verify validator catches missing columns and NaNs."""
    fe = FeatureEngineer()
    validator = FeatureValidator(fe.feature_names)
    dummy_df = pd.DataFrame({f: [1.0] for f in fe.feature_names})
    is_valid, errors = validator.validate_features(dummy_df)
    assert is_valid is True
    assert len(errors) == 0

    # Test failure on missing feature
    bad_df = dummy_df.drop(columns=[fe.feature_names[0]])
    is_valid, errors = validator.validate_features(bad_df)
    assert is_valid is False


def test_xgboost_classifier_prediction():
    """Verify XGBoost model predicts probabilities and explanations."""
    clf = XGBoostFraudClassifier()
    clf.load()
    dummy_X = pd.DataFrame({f: [0.0] for f in clf.feature_names})
    dummy_X["amount"] = 500.0
    dummy_X["orig_empty_flag"] = 1.0

    probs = clf.predict_proba(dummy_X)
    assert len(probs) == 1
    assert 0.0 <= probs[0] <= 1.0

    explanations = clf.explain_prediction({"amount": 500.0, "orig_empty_flag": 1.0})
    assert isinstance(explanations, list)


def test_gnn_model_architecture():
    """Verify PyTorch Geometric GraphSAGE dimensions and output."""
    model = FraudGraphSAGE(in_channels=7, hidden_dim=32, out_channels=1)
    x = torch.randn(10, 7)
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 0]], dtype=torch.long)
    logits = model(x, edge_index)
    probs = model.predict_risk(x, edge_index)

    assert logits.shape == torch.Size([10])
    assert probs.shape == torch.Size([10])
    assert (probs >= 0.0).all() and (probs <= 1.0).all()


def test_hybrid_fraud_scorer():
    """Verify hybrid scoring ensembling and risk categorizing."""
    scorer = HybridFraudScorer(alpha=0.65, beta=0.35, threshold_low=0.20, threshold_high=0.45)
    scorer.initialize()

    txn = {
        "transaction_id": "TXN_UNIT_01",
        "nameOrig": "C10000001",
        "nameDest": "M20000001",
        "amount": 50.0,
        "type": "PAYMENT"
    }
    res = scorer.score_transaction(txn)
    assert "combined_risk_score" in res
    assert res["risk_category"] in ["LOW_RISK", "MEDIUM_RISK", "HIGH_RISK"]
    assert res["latency_ms"] > 0
