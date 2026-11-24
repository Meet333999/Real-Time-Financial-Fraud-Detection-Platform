"""
XGBoost Fraud Classification Model Wrapper
===========================================
Provides model loading, probability scoring, threshold-based classification,
and local feature attribution for financial analysts.
"""

import os
import json
import logging
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
import xgboost as xgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
ARTIFACT_DIR = os.path.join(ROOT_DIR, "artifacts", "xgboost")


class XGBoostFraudClassifier:
    """Production wrapper for XGBoost transaction-level fraud classifier."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or os.path.join(ARTIFACT_DIR, "xgboost_fraud_model.json")
        self.meta_path = os.path.join(ARTIFACT_DIR, "model_metadata.json")
        self.model: Optional[xgb.XGBClassifier] = None
        self.feature_names: List[str] = []
        self.optimal_threshold: float = 0.50
        self.feature_importances: Dict[str, float] = {}

    def load(self, model_path: Optional[str] = None) -> None:
        """Load trained XGBoost model and associated metadata."""
        target_path = model_path or self.model_path
        if not os.path.exists(target_path):
            raise FileNotFoundError(f"XGBoost model file not found at: {target_path}")

        self.model = xgb.XGBClassifier()
        self.model.load_model(target_path)
        logger.info(f"Loaded XGBoost model from {target_path}")

        if os.path.exists(self.meta_path):
            with open(self.meta_path, "r") as f:
                meta = json.load(f)
                self.feature_names = meta.get("feature_names", [])
                self.optimal_threshold = float(meta.get("optimal_threshold", 0.50))
                self.feature_importances = meta.get("feature_importances", {})
                logger.info(f"Loaded model metadata: optimal_threshold={self.optimal_threshold:.4f}, features={len(self.feature_names)}")

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Return fraud probability [0.0, 1.0]."""
        if self.model is None:
            self.load()

        # Ensure correct column ordering
        if self.feature_names:
            missing = [c for c in self.feature_names if c not in X.columns]
            for m in missing:
                X[m] = 0.0
            X = X[self.feature_names]

        probabilities = self.model.predict_proba(X)
        return probabilities[:, 1]  # Return class 1 (fraud) probability

    def predict(self, X: pd.DataFrame, threshold: Optional[float] = None) -> Tuple[np.ndarray, np.ndarray]:
        """Return (probabilities, binary_predictions)."""
        thresh = threshold if threshold is not None else self.optimal_threshold
        probs = self.predict_proba(X)
        preds = (probs >= thresh).astype(int)
        return probs, preds

    def explain_prediction(self, feature_row: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Explain transaction risk using precomputed feature importance and value deviation.
        Returns top contributing risk factors for analyst review.
        """
        contributions = []
        for feat, val in feature_row.items():
            importance = self.feature_importances.get(feat, 0.0)
            if importance > 0:
                # Score impact by importance weighted by normalized magnitude
                try:
                    num_val = float(val)
                    impact = importance * min(5.0, abs(num_val))
                    contributions.append({
                        "feature": feat,
                        "value": round(num_val, 4),
                        "global_importance": round(importance, 4),
                        "risk_contribution": round(impact, 4)
                    })
                except (ValueError, TypeError):
                    continue

        contributions.sort(key=lambda x: x["risk_contribution"], reverse=True)
        return contributions[:top_k]
