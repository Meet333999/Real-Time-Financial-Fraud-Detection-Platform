"""
XGBoost Fraud Classification Training & Evaluation Script
=========================================================
Trains XGBoost model on chronologically split features with:
1. Exact class-imbalance weighting (scale_pos_weight)
2. PR-AUC optimization & early stopping on validation partition
3. Optimal decision threshold calibration (strictly on validation, tested on test)
4. Comprehensive evaluation (PR-AUC, ROC-AUC, Recall, Precision, F1, Confusion Matrix)
5. Full experiment tracking and artifact logging with MLflow
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import xgboost as xgb
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    precision_recall_curve
)
import mlflow
import mlflow.xgboost

DATA_PROCESSED_DIR = os.path.join(ROOT_DIR, "data", "processed")
ARTIFACT_XGB_DIR = os.path.join(ROOT_DIR, "artifacts", "xgboost")
ARTIFACT_EVAL_DIR = os.path.join(ROOT_DIR, "artifacts", "evaluation")
os.makedirs(ARTIFACT_XGB_DIR, exist_ok=True)
os.makedirs(ARTIFACT_EVAL_DIR, exist_ok=True)


def find_optimal_threshold(y_true: np.ndarray, y_proba: np.ndarray) -> Tuple[float, float]:
    """Find threshold that maximizes F1 score on validation set."""
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_proba)
    # Exclude endpoints where threshold is undefined
    f1_scores = np.divide(
        2 * (precisions * recalls),
        (precisions + recalls),
        out=np.zeros_like(precisions),
        where=(precisions + recalls) != 0
    )
    best_idx = np.argmax(f1_scores)
    # thresholds array has length len(precisions) - 1
    best_threshold = float(thresholds[best_idx]) if best_idx < len(thresholds) else 0.50
    best_f1 = float(f1_scores[best_idx])
    return best_threshold, best_f1


def evaluate_predictions(y_true: np.ndarray, y_proba: np.ndarray, threshold: float) -> Dict[str, Any]:
    """Compute comprehensive classification metrics."""
    y_pred = (y_proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_true, y_proba))
    pr_auc = float(average_precision_score(y_true, y_proba))

    return {
        "threshold": round(threshold, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
        "total_samples": len(y_true),
        "actual_fraud_samples": int(np.sum(y_true))
    }


def main():
    print("=" * 60)
    print("TRAINING XGBOOST TRANSACTION FRAUD CLASSIFIER")
    print("=" * 60)
    t0 = time.time()

    # 1. Load feature matrices
    print("[*] Loading processed feature sets...")
    train_df = pd.read_parquet(os.path.join(DATA_PROCESSED_DIR, "train_features.parquet"))
    val_df = pd.read_parquet(os.path.join(DATA_PROCESSED_DIR, "val_features.parquet"))
    test_df = pd.read_parquet(os.path.join(DATA_PROCESSED_DIR, "test_features.parquet"))

    drop_cols = ["isFraud", "transaction_id", "timestamp", "nameOrig", "device_id", "card_id"]
    feature_cols = [c for c in train_df.columns if c not in drop_cols]

    X_train = train_df[feature_cols]
    y_train = train_df["isFraud"].values.astype(int)

    X_val = val_df[feature_cols]
    y_val = val_df["isFraud"].values.astype(int)

    X_test = test_df[feature_cols]
    y_test = test_df["isFraud"].values.astype(int)

    # 2. Compute class weighting
    num_neg = int(np.sum(y_train == 0))
    num_pos = int(np.sum(y_train == 1))
    scale_pos_weight = float(num_neg / max(1, num_pos))
    print(f"[+] Class Balance in Train: {num_neg:,} Legitimate, {num_pos:,} Fraud")
    print(f"[+] Computed scale_pos_weight: {scale_pos_weight:.2f}")

    # 3. MLflow Setup
    mlflow_db_path = os.path.join(ROOT_DIR, "mlflow.db")
    mlflow.set_tracking_uri(f"sqlite:///{mlflow_db_path}")
    experiment_name = "fraud-detection-experiments"
    mlflow.set_experiment(experiment_name)

    hyperparams = {
        "n_estimators": 250,
        "max_depth": 5,
        "learning_rate": 0.05,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "min_child_weight": 2,
        "gamma": 0.1,
        "scale_pos_weight": scale_pos_weight,
        "eval_metric": "aucpr",
        "random_state": 42,
        "n_jobs": -1
    }

    with mlflow.start_run(run_name="xgboost_transaction_classifier"):
        print("[*] Training XGBoost model with early stopping on validation PR-AUC...")
        mlflow.log_params(hyperparams)
        mlflow.log_param("num_features", len(feature_cols))
        mlflow.log_param("train_samples", len(X_train))
        mlflow.log_param("val_samples", len(X_val))
        mlflow.log_param("test_samples", len(X_test))

        model = xgb.XGBClassifier(
            **hyperparams,
            early_stopping_rounds=30
        )

        model.fit(
            X_train, y_train,
            eval_set=[(X_train, y_train), (X_val, y_val)],
            verbose=False
        )
        print(f"[+] Best iteration: {model.best_iteration}")

        # 4. Predict probabilities
        val_proba = model.predict_proba(X_val)[:, 1]
        test_proba = model.predict_proba(X_test)[:, 1]

        # 5. Calibrate threshold strictly on Validation Set
        opt_thresh, val_best_f1 = find_optimal_threshold(y_val, val_proba)
        print(f"[+] Calibrated Optimal Threshold on Validation: {opt_thresh:.4f} (Val F1: {val_best_f1:.4f})")

        val_metrics = evaluate_predictions(y_val, val_proba, opt_thresh)
        test_metrics = evaluate_predictions(y_test, test_proba, opt_thresh)

        print("\n--- VALIDATION METRICS ---")
        for k, v in val_metrics.items():
            print(f"  {k}: {v}")

        print("\n--- TEST METRICS (HELD-OUT EVALUATION) ---")
        for k, v in test_metrics.items():
            print(f"  {k}: {v}")

        # Log metrics to MLflow
        for k, v in test_metrics.items():
            if isinstance(v, (int, float)):
                mlflow.log_metric(f"test_{k}", v)
        for k, v in val_metrics.items():
            if isinstance(v, (int, float)):
                mlflow.log_metric(f"val_{k}", v)

        # 6. Feature Importances
        importances = model.feature_importances_
        feature_importance_dict = {
            f: float(imp) for f, imp in zip(feature_cols, importances)
        }
        sorted_importances = dict(sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True))

        print("\n--- TOP 10 CONTRIBUTING FEATURES ---")
        for f, imp in list(sorted_importances.items())[:10]:
            print(f"  {f:30s}: {imp:.4f}")

        # 7. Save Artifacts
        model_save_path = os.path.join(ARTIFACT_XGB_DIR, "xgboost_fraud_model.json")
        model.save_model(model_save_path)
        print(f"\n[+] Saved model artifact to: {model_save_path}")

        meta = {
            "model_type": "XGBoost",
            "model_version": "1.0.0",
            "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "optimal_threshold": opt_thresh,
            "feature_names": feature_cols,
            "feature_importances": sorted_importances,
            "hyperparameters": hyperparams,
            "validation_metrics": val_metrics,
            "test_metrics": test_metrics
        }
        meta_path = os.path.join(ARTIFACT_XGB_DIR, "model_metadata.json")
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        eval_report_path = os.path.join(ARTIFACT_EVAL_DIR, "xgboost_evaluation_report.json")
        with open(eval_report_path, "w") as f:
            json.dump({
                "model": "XGBoost",
                "validation": val_metrics,
                "test": test_metrics,
                "feature_importance": sorted_importances
            }, f, indent=2)

        # Log artifacts with MLflow
        mlflow.log_artifact(model_save_path)
        mlflow.log_artifact(meta_path)
        mlflow.log_artifact(eval_report_path)

        print(f"[+] Logged run and artifacts to MLflow experiment '{experiment_name}'")
        print(f"[+] Total execution time: {time.time()-t0:.2f}s")


if __name__ == "__main__":
    main()
