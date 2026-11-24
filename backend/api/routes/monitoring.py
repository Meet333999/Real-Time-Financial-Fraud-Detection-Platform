"""
Drift Monitoring and Automated Retraining API Routes
===================================================
"""

import os
import json
from fastapi import APIRouter
from backend.monitoring.retraining_trigger import AutomatedRetrainingManager

router = APIRouter(tags=["Monitoring & Drift"])

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
REPORTS_DIR = os.path.join(ROOT_DIR, "data", "reports")
retraining_mgr = AutomatedRetrainingManager()


@router.get("/monitoring/drift")
def get_drift_status():
    """Retrieve latest Evidently AI drift report metrics and retraining audit history."""
    metrics_path = os.path.join(REPORTS_DIR, "latest_drift_metrics.json")
    history_path = os.path.join(REPORTS_DIR, "retraining_history.json")

    latest_metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            latest_metrics = json.load(f)

    history = []
    if os.path.exists(history_path):
        with open(history_path, "r") as f:
            history = json.load(f)

    return {
        "latest_drift_report": latest_metrics,
        "retraining_history": history,
        "monitoring_status": "ACTIVE",
        "configured_drift_threshold": retraining_mgr.drift_threshold,
        "cooldown_seconds": retraining_mgr.cooldown_seconds
    }


@router.post("/monitoring/trigger-retraining")
def trigger_manual_retraining():
    """Manually trigger candidate model retraining and evaluation."""
    result = retraining_mgr.execute_retraining_workflow(trigger_reason="Manual Analyst Trigger")
    return {
        "status": "COMPLETED",
        "result": result
    }
