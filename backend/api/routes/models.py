"""
Model Performance and Registry Routes
======================================
"""

import os
import json
from fastapi import APIRouter

router = APIRouter(tags=["Models"])

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
EVAL_DIR = os.path.join(ROOT_DIR, "artifacts", "evaluation")
XGB_DIR = os.path.join(ROOT_DIR, "artifacts", "xgboost")
GRAPH_DIR = os.path.join(ROOT_DIR, "artifacts", "graph")


@router.get("/models/status")
def get_models_status():
    """Retrieve operational status, versions, and hyperparameter configs of active models."""
    xgb_meta_path = os.path.join(XGB_DIR, "model_metadata.json")
    gnn_meta_path = os.path.join(GRAPH_DIR, "gnn_metadata.json")

    xgb_meta = {}
    if os.path.exists(xgb_meta_path):
        with open(xgb_meta_path, "r") as f:
            xgb_meta = json.load(f)

    gnn_meta = {}
    if os.path.exists(gnn_meta_path):
        with open(gnn_meta_path, "r") as f:
            gnn_meta = json.load(f)

    return {
        "xgboost_model": {
            "model_type": "XGBoost Classifier",
            "version": xgb_meta.get("model_version", "1.0.0"),
            "status": "ACTIVE_PRODUCTION",
            "trained_at": xgb_meta.get("trained_at", "N/A"),
            "optimal_threshold": xgb_meta.get("optimal_threshold", 0.2034),
            "features_count": len(xgb_meta.get("feature_names", [])),
            "scale_pos_weight": xgb_meta.get("hyperparameters", {}).get("scale_pos_weight", 676.42)
        },
        "graph_model": {
            "model_type": "PyTorch Geometric GraphSAGE",
            "version": gnn_meta.get("model_version", "1.0.0"),
            "status": "ACTIVE_PRODUCTION",
            "hidden_dimension": gnn_meta.get("hidden_dim", 64),
            "detected_rings_count": gnn_meta.get("detected_rings_count", 100)
        },
        "hybrid_ensemble": {
            "alpha_xgboost": 0.65,
            "beta_graph": 0.35,
            "status": "OPERATIONAL"
        }
    }


@router.get("/models/metrics")
def get_models_metrics():
    """Retrieve actual evaluation reports for XGBoost and GNN on held-out test data."""
    xgb_eval_path = os.path.join(EVAL_DIR, "xgboost_evaluation_report.json")
    gnn_eval_path = os.path.join(EVAL_DIR, "gnn_evaluation_report.json")

    xgb_eval = {}
    if os.path.exists(xgb_eval_path):
        with open(xgb_eval_path, "r") as f:
            xgb_eval = json.load(f)

    gnn_eval = {}
    if os.path.exists(gnn_eval_path):
        with open(gnn_eval_path, "r") as f:
            gnn_eval = json.load(f)

    return {
        "xgboost_evaluation": xgb_eval,
        "gnn_evaluation": gnn_eval
    }
