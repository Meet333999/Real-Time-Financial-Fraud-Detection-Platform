"""
Graph Neural Network Training & Fraud Ring Analytics Script
===========================================================
1. Builds multi-entity transaction graph with Accounts, Devices, and Cards
2. Performs fraud ring discovery (shared devices, mule hubs, card syndicates)
3. Trains PyTorch Geometric GraphSAGE model for entity risk scoring
4. Logs metrics, parameters, and model artifacts to MLflow
"""

import os
import sys
import json
import time
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix
)
import mlflow

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.graph.graph_builder import FinancialGraphBuilder
from backend.graph.graph_model import FraudGraphSAGE
from backend.graph.fraud_ring_detection import FraudRingDetector

DATA_PROCESSED_DIR = os.path.join(ROOT_DIR, "data", "processed")
GRAPH_DATA_DIR = os.path.join(ROOT_DIR, "data", "graph")
ARTIFACT_GRAPH_DIR = os.path.join(ROOT_DIR, "artifacts", "graph")
ARTIFACT_EVAL_DIR = os.path.join(ROOT_DIR, "artifacts", "evaluation")
os.makedirs(GRAPH_DATA_DIR, exist_ok=True)
os.makedirs(ARTIFACT_GRAPH_DIR, exist_ok=True)
os.makedirs(ARTIFACT_EVAL_DIR, exist_ok=True)


def main():
    print("=" * 60)
    print("GRAPH NEURAL NETWORK TRAINING & FRAUD RING DISCOVERY")
    print("=" * 60)
    t0 = time.time()

    # 1. Load data
    print("[*] Loading training and validation partitions for graph...")
    train_df = pd.read_parquet(os.path.join(DATA_PROCESSED_DIR, "train.parquet"))
    val_df = pd.read_parquet(os.path.join(DATA_PROCESSED_DIR, "val.parquet"))

    # 2. Fraud Ring Detection
    print("\n[*] Running Topological Fraud Ring Discovery...")
    ring_detector = FraudRingDetector()
    ring_detector.build_networkx_graph(train_df)
    detected_rings = ring_detector.detect_fraud_rings(min_ring_size=3)
    print(f"[+] Successfully detected {len(detected_rings)} fraud rings:")
    for r in detected_rings[:5]:
        print(f"    - [{r['ring_id']}] {r['ring_name']} | Risk: {r['risk_score']} | Pattern: {r['pattern_type']} | Nodes: {r['member_count']}")

    # 3. Build PyG Graph
    print("\n[*] Constructing PyTorch Geometric Graph...")
    graph_builder = FinancialGraphBuilder()
    data, meta = graph_builder.build_graph_from_dataframe(train_df, is_train=True)
    print(f"[+] Graph Built: {data.num_nodes:,} nodes, {data.num_edges:,} edges")
    print(f"[+] Nodes: {meta['accounts_count']:,} Accounts, {meta['devices_count']:,} Devices, {meta['cards_count']:,} Cards")
    print(f"[+] Fraud Entities: {meta['fraud_nodes']} ({meta['fraud_nodes']/data.num_nodes*100:.3f}%)")

    # Train / Val masks for node classification
    num_nodes = data.num_nodes
    indices = torch.randperm(num_nodes)
    train_size = int(0.80 * num_nodes)
    train_mask = torch.zeros(num_nodes, dtype=torch.bool)
    val_mask = torch.zeros(num_nodes, dtype=torch.bool)
    train_mask[indices[:train_size]] = True
    val_mask[indices[train_size:]] = True

    # Compute loss class weight
    y = data.y.float()
    num_pos = float(y[train_mask].sum())
    num_neg = float(len(y[train_mask]) - num_pos)
    pos_weight = torch.tensor([num_neg / max(1.0, num_pos)])
    print(f"[+] GNN pos_weight: {pos_weight.item():.2f}")

    # 4. Initialize GNN Model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[+] Training GNN on device: {device}")
    model = FraudGraphSAGE(in_channels=data.x.size(1), hidden_dim=64, out_channels=1, dropout=0.2).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01, weight_decay=1e-4)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight.to(device))

    x = data.x.to(device)
    edge_index = data.edge_index.to(device)
    y_dev = y.to(device)

    # 5. MLflow Tracking
    mlflow_db_path = os.path.join(ROOT_DIR, "mlflow.db")
    mlflow.set_tracking_uri(f"sqlite:///{mlflow_db_path}")
    mlflow.set_experiment("fraud-detection-experiments")

    best_val_pr_auc = 0.0
    best_metrics = {}

    with mlflow.start_run(run_name="pytorch_geometric_graphsage"):
        mlflow.log_params({
            "model_type": "GraphSAGE",
            "in_channels": data.x.size(1),
            "hidden_dim": 64,
            "dropout": 0.2,
            "epochs": 35,
            "lr": 0.01,
            "num_nodes": data.num_nodes,
            "num_edges": data.num_edges,
            "detected_rings_count": len(detected_rings)
        })

        print("\n[*] Commencing GNN training epochs...")
        for epoch in range(1, 36):
            model.train()
            optimizer.zero_grad()
            logits = model(x, edge_index)
            loss = criterion(logits[train_mask], y_dev[train_mask])
            loss.backward()
            optimizer.step()

            # Validation evaluation
            if epoch % 5 == 0 or epoch == 35:
                model.eval()
                with torch.no_grad():
                    val_logits = model(x, edge_index)[val_mask]
                    val_probs = torch.sigmoid(val_logits).cpu().numpy()
                    val_y = y[val_mask].cpu().numpy()

                    pr_auc = float(average_precision_score(val_y, val_probs))
                    roc_auc = float(roc_auc_score(val_y, val_probs)) if len(np.unique(val_y)) > 1 else 0.5
                    preds = (val_probs >= 0.50).astype(int)
                    rec = float(recall_score(val_y, preds, zero_division=0))
                    prec = float(precision_score(val_y, preds, zero_division=0))
                    f1 = float(f1_score(val_y, preds, zero_division=0))

                print(f"  Epoch {epoch:02d} | Loss: {loss.item():.4f} | Val PR-AUC: {pr_auc:.4f} | ROC-AUC: {roc_auc:.4f} | Recall: {rec:.4f} | F1: {f1:.4f}")

                if pr_auc > best_val_pr_auc:
                    best_val_pr_auc = pr_auc
                    best_metrics = {
                        "pr_auc": round(pr_auc, 4),
                        "roc_auc": round(roc_auc, 4),
                        "precision": round(prec, 4),
                        "recall": round(rec, 4),
                        "f1_score": round(f1, 4),
                        "loss": round(loss.item(), 4),
                        "epoch": epoch
                    }
                    # Save best checkpoint
                    model_path = os.path.join(ARTIFACT_GRAPH_DIR, "gnn_fraud_model.pt")
                    torch.save(model.state_dict(), model_path)

        # Log metrics to MLflow
        for k, v in best_metrics.items():
            mlflow.log_metric(f"gnn_{k}", v)

        # Save metadata and reports
        meta_payload = {
            "model_type": "PyTorch Geometric GraphSAGE",
            "model_version": "1.0.0",
            "in_channels": data.x.size(1),
            "hidden_dim": 64,
            "graph_metadata": meta,
            "metrics": best_metrics,
            "detected_rings_count": len(detected_rings)
        }
        meta_file = os.path.join(ARTIFACT_GRAPH_DIR, "gnn_metadata.json")
        with open(meta_file, "w") as f:
            json.dump(meta_payload, f, indent=2)

        eval_report_file = os.path.join(ARTIFACT_EVAL_DIR, "gnn_evaluation_report.json")
        with open(eval_report_file, "w") as f:
            json.dump(meta_payload, f, indent=2)

        mlflow.log_artifact(os.path.join(ARTIFACT_GRAPH_DIR, "gnn_fraud_model.pt"))
        mlflow.log_artifact(meta_file)
        mlflow.log_artifact(os.path.join(GRAPH_DATA_DIR, "detected_fraud_rings.json"))

        print("\n--- BEST GNN EVALUATION METRICS ---")
        for k, v in best_metrics.items():
            print(f"  {k}: {v}")

        print(f"\n[+] Saved GNN model artifact to: {os.path.join(ARTIFACT_GRAPH_DIR, 'gnn_fraud_model.pt')}")
        print(f"[+] Total GNN training execution time: {time.time()-t0:.2f}s")


if __name__ == "__main__":
    main()
