"""
Evidently AI Data & Prediction Drift Monitoring Engine
======================================================
Monitors feature drift and score distribution shifts between reference training
data and current production transactions. Generates HTML and JSON reports.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from evidently import Report
    from evidently.presets import DataDriftPreset
except ImportError:
    from evidently.report import Report
    from evidently.metric_preset import DataDriftPreset

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

DATA_PROCESSED_DIR = os.path.join(ROOT_DIR, "data", "processed")
REPORTS_DIR = os.path.join(ROOT_DIR, "data", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


class DriftMonitor:
    """Manages Evidently data drift reports and feature distribution audits."""

    def __init__(self, reference_path: Optional[str] = None):
        self.reference_path = reference_path or os.path.join(DATA_PROCESSED_DIR, "train_features.parquet")
        self.reference_df: Optional[pd.DataFrame] = None
        self._load_reference_data()

    def _load_reference_data(self) -> None:
        """Load reference training feature baseline."""
        if os.path.exists(self.reference_path):
            df = pd.read_parquet(self.reference_path)
            # Retain numerical and categorical features
            drop_cols = ["transaction_id", "timestamp", "nameOrig", "device_id", "card_id"]
            feature_cols = [c for c in df.columns if c not in drop_cols]
            # Sample reference to 5,000 for high-speed statistical comparison
            self.reference_df = df[feature_cols].sample(min(5000, len(df)), random_state=42)
            logger.info(f"Loaded {len(self.reference_df):,} reference records for drift monitoring.")
        else:
            logger.warning(f"Reference data not found at {self.reference_path}")

    def generate_drift_report(
        self,
        current_df: pd.DataFrame,
        report_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run statistical tests (Wasserstein / KS-test) comparing current transactions
        against reference baseline. Generates interactive HTML and JSON metrics.
        """
        if self.reference_df is None:
            self._load_reference_data()
            if self.reference_df is None:
                raise FileNotFoundError("Reference data unavailable for drift computation.")

        t0 = time.time()
        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        name = report_name or f"drift_report_{timestamp_str}"

        # Align columns
        cols = [c for c in self.reference_df.columns if c in current_df.columns]
        ref = self.reference_df[cols]
        curr = current_df[cols]

        logger.info(f"Running Evidently drift report on {len(curr):,} transactions across {len(cols)} features...")

        # Run Evidently 0.7 Report
        report = Report([DataDriftPreset()])
        snapshot = report.run(reference_data=ref, current_data=curr)

        # Export HTML report
        html_path = os.path.join(REPORTS_DIR, f"{name}.html")
        snapshot.save_html(html_path)

        # Compute Kolmogorov-Smirnov and distribution tests per column
        drift_by_columns = {}
        drifted_count = 0
        from scipy.stats import ks_2samp

        for c in cols:
            ref_col = ref[c].values
            curr_col = curr[c].values
            # Two-sample Kolmogorov-Smirnov test
            stat, p_val = ks_2samp(ref_col, curr_col)
            drift_detected = bool(p_val < 0.05)
            if drift_detected:
                drifted_count += 1
            drift_by_columns[c] = {
                "drift_detected": drift_detected,
                "drift_score": round(float(stat), 4),
                "p_value": round(float(p_val), 6),
                "stat_test": "Kolmogorov-Smirnov"
            }

        drift_share = float(drifted_count / max(1, len(cols)))
        dataset_drift = bool(drift_share >= 0.25)

        summary = {
            "report_id": name,
            "timestamp": datetime.utcnow().isoformat(),
            "reference_samples": len(ref),
            "current_samples": len(curr),
            "dataset_drift_detected": dataset_drift,
            "drift_share": round(drift_share, 4),
            "drift_share_pct": round(drift_share * 100.0, 2),
            "number_of_drifted_columns": drifted_count,
            "total_columns_evaluated": len(cols),
            "html_report_path": html_path,
            "execution_time_seconds": round(time.time() - t0, 2),
            "column_drift_details": drift_by_columns
        }

        # Save latest metrics summary
        summary_path = os.path.join(REPORTS_DIR, "latest_drift_metrics.json")
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)

        logger.info(f"Drift report generated in {summary['execution_time_seconds']}s:")
        logger.info(f"  Dataset Drift Detected: {dataset_drift}")
        logger.info(f"  Drift Share: {summary['drift_share_pct']}% ({drifted_count}/{len(cols)} features drifted)")
        logger.info(f"  Saved HTML report to: {html_path}")

        return summary
