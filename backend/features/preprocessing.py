"""
Data Preprocessing and Ingestion Module
=======================================
Handles data loading, validation, cleaning, and chronological train/val/test splitting.
Guarantees NO data leakage for temporal financial transaction data.
"""

import os
import json
import logging
from typing import Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class TransactionDataPreprocessor:
    """Preprocesses raw transaction data, validates schema, and creates clean temporal splits."""

    def __init__(self, raw_path: Optional[str] = None):
        self.raw_path = raw_path

    def load_data(self, path: Optional[str] = None) -> pd.DataFrame:
        """Load dataset from parquet or csv."""
        file_path = path or self.raw_path
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"Transaction data file not found at: {file_path}")

        logger.info(f"Loading raw dataset from {file_path}...")
        if file_path.endswith(".parquet"):
            df = pd.read_parquet(file_path)
        elif file_path.endswith(".csv"):
            df = pd.read_csv(file_path)
        else:
            raise ValueError("Unsupported file format. Provide .parquet or .csv")

        logger.info(f"Loaded {len(df):,} transactions across {len(df.columns)} columns.")
        return df

    def clean_and_normalize(self, df: pd.DataFrame) -> pd.DataFrame:
        """Deduplicate, validate types, and sort chronologically."""
        initial_len = len(df)
        df = df.drop_duplicates(subset=["transaction_id"] if "transaction_id" in df.columns else None)
        if len(df) < initial_len:
            logger.warning(f"Removed {initial_len - len(df)} duplicate records.")

        # Ensure correct column types
        if "amount" in df.columns:
            df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)
            df = df[df["amount"] >= 0.0]

        if "isFraud" in df.columns:
            df["isFraud"] = df["isFraud"].astype(int)

        if "step" in df.columns:
            df["step"] = df["step"].astype(int)
            df = df.sort_values(by="step").reset_index(drop=True)
        elif "timestamp" in df.columns:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.sort_values(by="timestamp").reset_index(drop=True)

        return df

    def chronological_split(
        self,
        df: pd.DataFrame,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        time_col: str = "step"
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Splits data chronologically to strictly prevent lookahead bias / data leakage.
        Returns (train_df, val_df, test_df, split_metadata).
        """
        assert abs((train_ratio + val_ratio + test_ratio) - 1.0) < 1e-5, "Ratios must sum to 1.0"
        
        # Sort chronologically
        if time_col in df.columns:
            df = df.sort_values(by=time_col).reset_index(drop=True)

        n = len(df)
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))

        train_df = df.iloc[:train_end].copy().reset_index(drop=True)
        val_df = df.iloc[train_end:val_end].copy().reset_index(drop=True)
        test_df = df.iloc[val_end:].copy().reset_index(drop=True)

        target_col = "isFraud" if "isFraud" in df.columns else ("Class" if "Class" in df.columns else None)

        def get_stats(subset_df: pd.DataFrame, name: str) -> dict:
            count = len(subset_df)
            fraud_count = int(subset_df[target_col].sum()) if target_col and target_col in subset_df else 0
            fraud_rate = round((fraud_count / max(1, count)) * 100, 4)
            time_min = subset_df[time_col].min() if time_col in subset_df else None
            time_max = subset_df[time_col].max() if time_col in subset_df else None
            return {
                "count": count,
                "fraud_count": fraud_count,
                "fraud_rate_pct": fraud_rate,
                "time_min": time_min,
                "time_max": time_max
            }

        split_meta = {
            "strategy": "chronological_split",
            "total_records": n,
            "train": get_stats(train_df, "train"),
            "validation": get_stats(val_df, "validation"),
            "test": get_stats(test_df, "test")
        }

        logger.info(f"Chronological split completed:")
        logger.info(f"  Train:      {split_meta['train']['count']:,} rows | Fraud: {split_meta['train']['fraud_count']} ({split_meta['train']['fraud_rate_pct']}%)")
        logger.info(f"  Validation: {split_meta['validation']['count']:,} rows | Fraud: {split_meta['validation']['fraud_count']} ({split_meta['validation']['fraud_rate_pct']}%)")
        logger.info(f"  Test:       {split_meta['test']['count']:,} rows | Fraud: {split_meta['test']['fraud_count']} ({split_meta['test']['fraud_rate_pct']}%)")

        return train_df, val_df, test_df, split_meta
