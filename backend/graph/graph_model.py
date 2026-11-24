"""
PyTorch Geometric Graph Neural Network for Fraud Detection
==========================================================
Implements GraphSAGE (SAGEConv) architecture for multi-hop entity risk scoring.
"""

import os
from typing import Optional
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ARTIFACT_GRAPH_DIR = os.path.join(ROOT_DIR, "artifacts", "graph")
os.makedirs(ARTIFACT_GRAPH_DIR, exist_ok=True)


class FraudGraphSAGE(nn.Module):
    """Deep Graph Neural Network using SAGEConv layers for entity representation learning."""

    def __init__(self, in_channels: int = 7, hidden_dim: int = 64, out_channels: int = 1, dropout: float = 0.2):
        super(FraudGraphSAGE, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_dim)
        self.bn1 = nn.BatchNorm1d(hidden_dim)
        self.conv2 = SAGEConv(hidden_dim, hidden_dim // 2)
        self.bn2 = nn.BatchNorm1d(hidden_dim // 2)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim // 2, 16),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(16, out_channels)
        )
        self.dropout = dropout

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Forward pass returning raw logits for BCEWithLogitsLoss."""
        h = self.conv1(x, edge_index)
        h = self.bn1(h)
        h = F.relu(h)
        h = F.dropout(h, p=self.dropout, training=self.training)

        h = self.conv2(h, edge_index)
        h = self.bn2(h)
        h = F.relu(h)
        h = F.dropout(h, p=self.dropout, training=self.training)

        logits = self.classifier(h).squeeze(-1)
        return logits

    def get_embeddings(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Extract learned entity embeddings (32-dim) for downstream clustering or similarity."""
        self.eval()
        with torch.no_grad():
            h = self.conv1(x, edge_index)
            h = F.relu(self.bn1(h))
            h = self.conv2(h, edge_index)
            h = F.relu(self.bn2(h))
        return h

    def predict_risk(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Return calibrated fraud probabilities [0.0, 1.0]."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x, edge_index)
            probs = torch.sigmoid(logits)
        return probs

    def save(self, path: Optional[str] = None) -> str:
        target = path or os.path.join(ARTIFACT_GRAPH_DIR, "gnn_fraud_model.pt")
        torch.save(self.state_dict(), target)
        return target

    def load(self, path: Optional[str] = None, device: str = "cpu") -> None:
        target = path or os.path.join(ARTIFACT_GRAPH_DIR, "gnn_fraud_model.pt")
        self.load_state_dict(torch.load(target, map_location=device))
        self.to(device)
        self.eval()
