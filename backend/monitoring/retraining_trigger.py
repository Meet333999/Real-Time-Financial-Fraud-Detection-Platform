"""
Automated Model Retraining Trigger and Promotion Pipeline
=========================================================
Monitors drift alerts, validates cooldown windows, trains candidate models,
and executes gated promotion if candidate acceptance criteria are satisfied.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.monitoring.drift_detection import DriftMonitor
import mlflow

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REPORTS_DIR = os.path.join(ROOT_DIR, "data", "reports")
EVAL_DIR = os.path.join(ROOT_DIR, "artifacts", "evaluation")
XGB_DIR = os.path.join(ROOT_DIR, "artifacts", "xgboost")


class AutomatedRetrainingManager:
    """Orchestrates drift threshold evaluation, candidate training, and gated promotion."""

    def __init__(
        self,
        drift_threshold: float = 0.25,
        cooldown_seconds: int = 300
    ):
        self.drift_threshold = drift_threshold
        self.cooldown_seconds = cooldown_seconds
        self.last_retrain_timestamp: Optional[float] = None
        self.history_file = os.path.join(REPORTS_DIR, "retraining_history.json")

    def should_trigger_retraining(self, drift_summary: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check if drift severity exceeds threshold AND cooldown has elapsed.
        """
        current_time = time.time()
        drift_share = drift_summary.get("drift_share", 0.0)

        # Check cooldown safeguard
        if self.last_retrain_timestamp is not None:
            elapsed = current_time - self.last_retrain_timestamp
            if elapsed < self.cooldown_seconds:
                remaining = int(self.cooldown_seconds - elapsed)
                return False, f"Cooldown safeguard active ({remaining}s remaining). Retraining skipped."

        # Check threshold
        if drift_share >= self.drift_threshold or drift_summary.get("dataset_drift_detected", False):
            return True, f"Drift threshold exceeded ({drift_share*100:.1f}% >= {self.drift_threshold*100:.1f}%). Triggering retraining."

        return False, f"Drift within nominal limits ({drift_share*100:.1f}% < {self.drift_threshold*100:.1f}%). No retraining needed."

    def execute_retraining_workflow(self, trigger_reason: str = "Automated Drift Trigger") -> Dict[str, Any]:
        """
        Executes candidate model retraining, benchmark comparison, and gated promotion.
        """
        t0 = time.time()
        logger.info(f"Initiating Model Retraining Pipeline. Reason: {trigger_reason}")

        # 1. Load active production model evaluation
        active_eval_path = os.path.join(EVAL_DIR, "xgboost_evaluation_report.json")
        current_pr_auc = 0.90
        current_f1 = 0.85
        if os.path.exists(active_eval_path):
            with open(active_eval_path, "r") as f:
                active_meta = json.load(f)
                current_pr_auc = active_meta.get("test", {}).get("pr_auc", 0.90)
                current_f1 = active_meta.get("test", {}).get("f1_score", 0.85)

        # 2. Train Candidate Model via scripts/train_xgboost.py
        import subprocess
        script_path = os.path.join(ROOT_DIR, "scripts", "train_xgboost.py")
        res = subprocess.run([sys.executable, script_path], capture_output=True, text=True)

        # 3. Read Candidate Metrics
        with open(active_eval_path, "r") as f:
            candidate_meta = json.load(f)
            candidate_pr_auc = candidate_meta.get("test", {}).get("pr_auc", 0.0)
            candidate_f1 = candidate_meta.get("test", {}).get("f1_score", 0.0)

        # 4. Gated Model Promotion Decision
        # Criteria: Candidate must not degrade PR-AUC by more than 0.02 and must achieve F1 >= 0.80
        is_promoted = (candidate_pr_auc >= (current_pr_auc - 0.02)) and (candidate_f1 >= 0.80)
        decision = "PROMOTED_TO_PRODUCTION" if is_promoted else "REJECTED_BELOW_ACCEPTANCE_CRITERIA"

        self.last_retrain_timestamp = time.time()

        retrain_event = {
            "retraining_id": f"RETRAIN_{int(self.last_retrain_timestamp)}",
            "timestamp": datetime.utcnow().isoformat(),
            "trigger_reason": trigger_reason,
            "current_model_pr_auc": current_pr_auc,
            "candidate_model_pr_auc": candidate_pr_auc,
            "candidate_model_f1": candidate_f1,
            "promotion_decision": decision,
            "is_promoted": is_promoted,
            "duration_seconds": round(time.time() - t0, 2)
        }

        # Append to history
        history = []
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r") as f:
                    history = json.load(f)
            except Exception:
                history = []
        history.append(retrain_event)
        with open(self.history_file, "w") as f:
            json.dump(history, f, indent=2)

        logger.info(f"Retraining workflow finished in {retrain_event['duration_seconds']}s: {decision}")
        return retrain_event
