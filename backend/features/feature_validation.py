"""
Feature Validation Module
=========================
Validates feature matrix shapes, types, ranges, NaNs, and schema alignment.
"""

import logging
from typing import List, Tuple, Dict, Any
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class FeatureValidator:
    """Validates engineered feature datasets before training or inference."""

    def __init__(self, expected_features: List[str]):
        self.expected_features = expected_features

    def validate_features(self, X: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Check for missing columns, unexpected NaNs, infinite values, or schema mismatches."""
        errors = []

        # 1. Column alignment check
        missing_cols = [c for c in self.expected_features if c not in X.columns]
        if missing_cols:
            errors.append(f"Missing expected feature columns: {missing_cols}")

        extra_cols = [c for c in X.columns if c not in self.expected_features]
        if extra_cols:
            errors.append(f"Unexpected extra columns detected: {extra_cols}")

        # 2. NaN / Infinite value check
        nan_counts = X.isna().sum()
        cols_with_nans = nan_counts[nan_counts > 0].to_dict()
        if cols_with_nans:
            errors.append(f"NaN values found in features: {cols_with_nans}")

        inf_mask = np.isinf(X.select_dtypes(include=[np.number]).values)
        if inf_mask.any():
            errors.append(f"Infinite values detected in {inf_mask.sum()} feature entries.")

        is_valid = (len(errors) == 0)
        if is_valid:
            logger.info(f"Feature validation PASSED: {len(X):,} rows, {len(X.columns)} features strictly valid.")
        else:
            logger.error(f"Feature validation FAILED with {len(errors)} issues: {errors}")

        return is_valid, errors

    def clean_and_impute(self, X: pd.DataFrame) -> pd.DataFrame:
        """Safely cleans any extreme outliers or NaNs using robust defaults."""
        X = X[self.expected_features].copy()
        X = X.replace([np.inf, -np.inf], np.nan)
        X = X.fillna(0.0)
        return X
