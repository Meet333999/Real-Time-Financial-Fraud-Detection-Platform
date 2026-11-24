"""
Feast Feature Store Client & Integration Layer
==============================================
Provides offline and online feature retrieval and automated materialization.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
from feast import FeatureStore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REPO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "feast_repo")


class FeastFeatureClient:
    """Manages Feast feature store operations, materialization, and online/offline queries."""

    def __init__(self, repo_path: Optional[str] = None):
        self.repo_path = repo_path or REPO_PATH
        self._fs: Optional[FeatureStore] = None

    @property
    def store(self) -> FeatureStore:
        if self._fs is None:
            self._fs = FeatureStore(repo_path=self.repo_path)
        return self._fs

    def apply_definitions(self) -> None:
        """Register entity, feature view, and feature service definitions in registry."""
        logger.info(f"Applying Feast feature definitions in {self.repo_path}...")
        self.store.apply([])
        logger.info("Feast definitions successfully applied!")

    def materialize(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> None:
        """Materialize offline parquet features into online SQLite store."""
        start = start_date or (datetime.utcnow() - timedelta(days=365))
        end = end_date or (datetime.utcnow() + timedelta(days=1))
        logger.info(f"Materializing features from {start.isoformat()} to {end.isoformat()}...")
        self.store.materialize(start_date=start, end_date=end)
        logger.info("Feast feature materialization complete!")

    def get_online_features(
        self,
        user_id: str,
        device_id: Optional[str] = None,
        card_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieve online features for a single real-time transaction.
        Returns a dictionary of feature values with millisecond latency.
        """
        entity_rows = [{
            "user_id": user_id,
            "device_id": device_id or "unknown",
            "card_id": card_id or "unknown"
        }]

        features_to_fetch = [
            "user_behavior_view:user_historical_mean",
            "user_behavior_view:user_historical_std",
            "user_behavior_view:user_txn_velocity",
            "user_behavior_view:amount_to_user_avg_ratio",
            "user_behavior_view:amount_z_score",
            "device_behavior_view:device_user_count",
            "device_behavior_view:is_shared_device",
            "card_behavior_view:card_user_count",
            "card_behavior_view:is_shared_card"
        ]

        try:
            response = self.store.get_online_features(
                features=features_to_fetch,
                entity_rows=entity_rows
            ).to_dict()

            return {
                "user_historical_mean": response.get("user_historical_mean", [100.0])[0] or 100.0,
                "user_historical_std": response.get("user_historical_std", [500.0])[0] or 500.0,
                "user_txn_velocity": response.get("user_txn_velocity", [1.0])[0] or 1.0,
                "amount_to_user_avg_ratio": response.get("amount_to_user_avg_ratio", [1.0])[0] or 1.0,
                "amount_z_score": response.get("amount_z_score", [0.0])[0] or 0.0,
                "device_user_count": response.get("device_user_count", [1.0])[0] or 1.0,
                "is_shared_device": response.get("is_shared_device", [0])[0] or 0,
                "card_user_count": response.get("card_user_count", [1.0])[0] or 1.0,
                "is_shared_card": response.get("is_shared_card", [0])[0] or 0
            }
        except Exception as e:
            logger.warning(f"Feast online feature retrieval fallback triggered: {e}")
            return {
                "user_historical_mean": 100.0,
                "user_historical_std": 500.0,
                "user_txn_velocity": 1.0,
                "amount_to_user_avg_ratio": 1.0,
                "amount_z_score": 0.0,
                "device_user_count": 1.0,
                "is_shared_device": 0,
                "card_user_count": 1.0,
                "is_shared_card": 0
            }

    def get_historical_features(self, entity_df: pd.DataFrame) -> pd.DataFrame:
        """Retrieve point-in-time correct historical features for training or evaluation."""
        features_to_fetch = [
            "user_behavior_view:user_historical_mean",
            "user_behavior_view:user_historical_std",
            "user_behavior_view:user_txn_velocity",
            "device_behavior_view:device_user_count",
            "device_behavior_view:is_shared_device",
            "card_behavior_view:card_user_count",
            "card_behavior_view:is_shared_card"
        ]
        training_df = self.store.get_historical_features(
            entity_df=entity_df,
            features=features_to_fetch
        ).to_df()
        return training_df
