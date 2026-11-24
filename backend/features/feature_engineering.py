"""
Comprehensive Transaction and Behavioral Feature Engineering Pipeline
=====================================================================
Computes:
1. Transaction features (amount, log-amount, hour, day, type one-hot)
2. Balance integrity features (orig_balance_change, dest_balance_change, orig_error_balance, dest_error_balance, orig_empty_flag)
3. Behavioral features (user historical mean, std, z-score, velocity, deviation)
4. Device & Network features (device_user_count, card_user_count, multi-account indicators)
5. Strict training-serving consistency guaranteed across batch and online inference.
"""

import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

FEATURE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "features")
os.makedirs(FEATURE_DIR, exist_ok=True)


class FeatureEngineer:
    """Production-grade feature engineer for batch training and real-time inference."""

    def __init__(self, stats_path: Optional[str] = None):
        self.stats_path = stats_path or os.path.join(FEATURE_DIR, "behavioral_aggregates.joblib")
        self.user_stats: Dict[str, Dict[str, float]] = {}
        self.device_stats: Dict[str, int] = {}
        self.card_stats: Dict[str, int] = {}
        self.global_stats: Dict[str, float] = {
            "mean_amount": 100.0,
            "std_amount": 500.0,
            "max_amount": 10000.0
        }
        self.feature_names: List[str] = [
            "amount",
            "log_amount",
            "hour",
            "day_of_week",
            "is_weekend",
            "oldbalanceOrg",
            "newbalanceOrig",
            "oldbalanceDest",
            "newbalanceDest",
            "orig_balance_change",
            "dest_balance_change",
            "orig_error_balance",
            "dest_error_balance",
            "orig_empty_flag",
            "user_historical_mean",
            "user_historical_std",
            "amount_to_user_avg_ratio",
            "amount_z_score",
            "user_txn_velocity",
            "device_user_count",
            "card_user_count",
            "is_shared_device",
            "is_shared_card",
            "type_CASH_IN",
            "type_CASH_OUT",
            "type_DEBIT",
            "type_PAYMENT",
            "type_TRANSFER"
        ]

    def fit_behavioral_profiles(self, train_df: pd.DataFrame) -> None:
        """
        Fit baseline behavioral profiles strictly on historical training data.
        Prevents lookahead bias and data leakage into validation or test sets.
        """
        logger.info(f"Fitting behavioral profiles on {len(train_df):,} training transactions...")

        # Global statistics
        self.global_stats["mean_amount"] = float(train_df["amount"].mean())
        self.global_stats["std_amount"] = float(train_df["amount"].std()) or 1.0
        self.global_stats["max_amount"] = float(train_df["amount"].max())

        # User-level aggregations
        user_grouped = train_df.groupby("nameOrig")["amount"].agg(["mean", "std", "count", "max"])
        for user, row in user_grouped.iterrows():
            self.user_stats[str(user)] = {
                "mean": float(row["mean"]),
                "std": float(row["std"]) if pd.notnull(row["std"]) and row["std"] > 0 else float(row["mean"] * 0.5),
                "count": int(row["count"]),
                "max": float(row["max"])
            }

        # Device association counts (accounts sharing this device)
        if "device_id" in train_df.columns:
            device_accs = train_df.groupby("device_id")["nameOrig"].nunique().to_dict()
            self.device_stats = {str(k): int(v) for k, v in device_accs.items()}

        # Card association counts (accounts sharing this card)
        if "card_id" in train_df.columns:
            card_accs = train_df.groupby("card_id")["nameOrig"].nunique().to_dict()
            self.card_stats = {str(k): int(v) for k, v in card_accs.items()}

        # Save artifacts
        payload = {
            "user_stats": self.user_stats,
            "device_stats": self.device_stats,
            "card_stats": self.card_stats,
            "global_stats": self.global_stats,
            "feature_names": self.feature_names
        }
        joblib.dump(payload, self.stats_path)
        logger.info(f"Saved behavioral profiles to {self.stats_path} ({len(self.user_stats):,} user profiles)")

    def load_behavioral_profiles(self, path: Optional[str] = None) -> None:
        """Load precomputed behavioral profiles for consistent inference."""
        target_path = path or self.stats_path
        if not os.path.exists(target_path):
            raise FileNotFoundError(f"Behavioral profile artifact not found at {target_path}")

        payload = joblib.load(target_path)
        self.user_stats = payload["user_stats"]
        self.device_stats = payload.get("device_stats", {})
        self.card_stats = payload.get("card_stats", {})
        self.global_stats = payload.get("global_stats", self.global_stats)
        self.feature_names = payload.get("feature_names", self.feature_names)
        logger.info(f"Loaded behavioral profiles for {len(self.user_stats):,} users from {target_path}")

    def transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Optional[np.ndarray]]:
        """
        Transform raw transaction dataframe into full feature matrix X (and target y if present).
        Guarantees identical feature representation in offline training and real-time online inference.
        """
        df = df.copy()

        # 1. Transaction Features
        amount = df["amount"].values.astype(float)
        log_amount = np.log1p(np.maximum(0.0, amount))

        # Time features
        if "timestamp" in df.columns:
            ts = pd.to_datetime(df["timestamp"])
            hour = ts.dt.hour.values
            day_of_week = ts.dt.dayofweek.values
        elif "step" in df.columns:
            # PaySim step represents hours from start of simulation
            step = df["step"].values
            hour = (step % 24)
            day_of_week = ((step // 24) % 7)
        else:
            hour = np.zeros(len(df), dtype=int)
            day_of_week = np.zeros(len(df), dtype=int)

        is_weekend = np.isin(day_of_week, [5, 6]).astype(int)

        # 2. Balance integrity features
        old_orig = df.get("oldbalanceOrg", pd.Series(np.zeros(len(df)))).values.astype(float)
        new_orig = df.get("newbalanceOrig", pd.Series(np.zeros(len(df)))).values.astype(float)
        old_dest = df.get("oldbalanceDest", pd.Series(np.zeros(len(df)))).values.astype(float)
        new_dest = df.get("newbalanceDest", pd.Series(np.zeros(len(df)))).values.astype(float)

        orig_balance_change = old_orig - new_orig
        dest_balance_change = new_dest - old_dest
        orig_error_balance = (old_orig - amount) - new_orig
        dest_error_balance = (old_dest + amount) - new_dest
        orig_empty_flag = ((new_orig == 0.0) & (amount > 0.0)).astype(int)

        # 3. Behavioral Features via User Profiles
        user_mean = np.zeros(len(df), dtype=float)
        user_std = np.zeros(len(df), dtype=float)
        user_velocity = np.zeros(len(df), dtype=float)

        orig_users = df["nameOrig"].astype(str).values if "nameOrig" in df.columns else np.array(["unknown"] * len(df))
        global_m = self.global_stats.get("mean_amount", 100.0)
        global_s = self.global_stats.get("std_amount", 500.0)

        for i, user in enumerate(orig_users):
            if user in self.user_stats:
                prof = self.user_stats[user]
                user_mean[i] = prof["mean"]
                user_std[i] = prof["std"]
                user_velocity[i] = min(prof["count"], 50)
            else:
                user_mean[i] = global_m
                user_std[i] = global_s
                user_velocity[i] = 1.0

        amount_to_user_avg_ratio = np.where(user_mean > 0, amount / user_mean, 1.0)
        amount_to_user_avg_ratio = np.clip(amount_to_user_avg_ratio, 0.0, 100.0)

        amount_z_score = np.where(user_std > 0, (amount - user_mean) / user_std, 0.0)
        amount_z_score = np.clip(amount_z_score, -5.0, 15.0)

        # 4. Device and Card Network Features
        device_ids = df["device_id"].astype(str).values if "device_id" in df.columns else np.array(["unknown"] * len(df))
        card_ids = df["card_id"].astype(str).values if "card_id" in df.columns else np.array(["unknown"] * len(df))

        device_user_count = np.array([self.device_stats.get(d, 1) for d in device_ids], dtype=float)
        card_user_count = np.array([self.card_stats.get(c, 1) for c in card_ids], dtype=float)

        is_shared_device = (device_user_count > 1).astype(int)
        is_shared_card = (card_user_count > 1).astype(int)

        # 5. Type One-Hot Encoding
        txn_types = df["type"].astype(str).values if "type" in df.columns else np.array(["TRANSFER"] * len(df))
        is_cash_in = (txn_types == "CASH_IN").astype(int)
        is_cash_out = (txn_types == "CASH_OUT").astype(int)
        is_debit = (txn_types == "DEBIT").astype(int)
        is_payment = (txn_types == "PAYMENT").astype(int)
        is_transfer = (txn_types == "TRANSFER").astype(int)

        feature_dict = {
            "amount": amount,
            "log_amount": log_amount,
            "hour": hour,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "oldbalanceOrg": old_orig,
            "newbalanceOrig": new_orig,
            "oldbalanceDest": old_dest,
            "newbalanceDest": new_dest,
            "orig_balance_change": orig_balance_change,
            "dest_balance_change": dest_balance_change,
            "orig_error_balance": orig_error_balance,
            "dest_error_balance": dest_error_balance,
            "orig_empty_flag": orig_empty_flag,
            "user_historical_mean": user_mean,
            "user_historical_std": user_std,
            "amount_to_user_avg_ratio": amount_to_user_avg_ratio,
            "amount_z_score": amount_z_score,
            "user_txn_velocity": user_velocity,
            "device_user_count": device_user_count,
            "card_user_count": card_user_count,
            "is_shared_device": is_shared_device,
            "is_shared_card": is_shared_card,
            "type_CASH_IN": is_cash_in,
            "type_CASH_OUT": is_cash_out,
            "type_DEBIT": is_debit,
            "type_PAYMENT": is_payment,
            "type_TRANSFER": is_transfer
        }

        X = pd.DataFrame(feature_dict, columns=self.feature_names)

        # Extract target if present
        y = None
        if "isFraud" in df.columns:
            y = df["isFraud"].values.astype(int)
        elif "Class" in df.columns:
            y = df["Class"].values.astype(int)

        return X, y
