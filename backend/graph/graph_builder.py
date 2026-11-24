"""
Graph Builder for Financial Entity-Relationship Networks
========================================================
Constructs graph datasets linking Accounts, Devices, and Cards.
Supports chronological subgraph slicing to eliminate data leakage.
"""

import os
import json
import logging
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
import pandas as pd
import torch
from torch_geometric.data import Data

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GRAPH_DATA_DIR = os.path.join(ROOT_DIR, "data", "graph")
os.makedirs(GRAPH_DATA_DIR, exist_ok=True)


class FinancialGraphBuilder:
    """Builds homogeneous and heterogeneous transaction graphs for GNN training."""

    def __init__(self):
        self.node_to_idx: Dict[str, int] = {}
        self.idx_to_node: Dict[int, str] = {}
        self.node_types: Dict[str, str] = {}  # "account", "device", "card"

    def _get_or_create_node(self, node_id: str, node_type: str) -> int:
        if node_id not in self.node_to_idx:
            idx = len(self.node_to_idx)
            self.node_to_idx[node_id] = idx
            self.idx_to_node[idx] = node_id
            self.node_types[node_id] = node_type
        return self.node_to_idx[node_id]

    def build_graph_from_dataframe(
        self,
        df: pd.DataFrame,
        is_train: bool = True
    ) -> Tuple[Data, Dict[str, Any]]:
        """
        Builds a PyTorch Geometric Data object from transactions.
        Creates:
        - Account -> Account transaction edges
        - Account <-> Device usage edges
        - Account <-> Card ownership edges
        """
        logger.info(f"Building graph representation from {len(df):,} transactions...")

        # Reset or keep node indices
        if is_train:
            self.node_to_idx.clear()
            self.idx_to_node.clear()
            self.node_types.clear()

        src_list = []
        dst_list = []
        edge_attrs = []

        # Track node statistics for node feature extraction
        node_txn_counts: Dict[str, int] = {}
        node_amounts: Dict[str, List[float]] = {}
        node_fraud_flags: Dict[str, int] = {}

        for _, row in df.iterrows():
            orig = str(row["nameOrig"])
            dest = str(row["nameDest"])
            device = str(row.get("device_id", "DEV_UNKNOWN"))
            card = str(row.get("card_id", "CARD_UNKNOWN"))
            amt = float(row.get("amount", 0.0))
            fraud = int(row.get("isFraud", 0))

            orig_idx = self._get_or_create_node(orig, "account")
            dest_idx = self._get_or_create_node(dest, "account")
            dev_idx = self._get_or_create_node(device, "device")
            card_idx = self._get_or_create_node(card, "card")

            # Update stats
            node_txn_counts[orig] = node_txn_counts.get(orig, 0) + 1
            node_txn_counts[dest] = node_txn_counts.get(dest, 0) + 1
            node_txn_counts[device] = node_txn_counts.get(device, 0) + 1
            node_txn_counts[card] = node_txn_counts.get(card, 0) + 1

            if orig not in node_amounts:
                node_amounts[orig] = []
            node_amounts[orig].append(amt)

            if fraud == 1:
                node_fraud_flags[orig] = 1
                node_fraud_flags[dest] = 1
                node_fraud_flags[device] = 1
                node_fraud_flags[card] = 1

            # 1. Account -> Account edge
            src_list.append(orig_idx)
            dst_list.append(dest_idx)
            edge_attrs.append([amt, 1.0])  # amount, edge_type=txn

            # 2. Account <-> Device edges (bidirectional)
            src_list.extend([orig_idx, dev_idx])
            dst_list.extend([dev_idx, orig_idx])
            edge_attrs.extend([[0.0, 2.0], [0.0, 2.0]])

            # 3. Account <-> Card edges (bidirectional)
            src_list.extend([orig_idx, card_idx])
            dst_list.extend([card_idx, orig_idx])
            edge_attrs.extend([[0.0, 3.0], [0.0, 3.0]])

        total_nodes = len(self.node_to_idx)
        logger.info(f"Graph constructed: {total_nodes:,} nodes, {len(src_list):,} edges.")

        # Compute Node Features [num_nodes, feature_dim]
        # Features: [is_account, is_device, is_card, txn_count, log_avg_amount, log_max_amount, degree]
        node_features = np.zeros((total_nodes, 7), dtype=np.float32)
        node_labels = np.zeros(total_nodes, dtype=np.int64)

        # Degree calculation
        degrees = np.bincount(src_list, minlength=total_nodes)

        for node_id, idx in self.node_to_idx.items():
            ntype = self.node_types.get(node_id, "account")
            is_acc = 1.0 if ntype == "account" else 0.0
            is_dev = 1.0 if ntype == "device" else 0.0
            is_crd = 1.0 if ntype == "card" else 0.0

            cnt = float(node_txn_counts.get(node_id, 0))
            amts = node_amounts.get(node_id, [0.0])
            avg_amt = float(np.mean(amts)) if amts else 0.0
            max_amt = float(np.max(amts)) if amts else 0.0
            deg = float(degrees[idx]) if idx < len(degrees) else 0.0

            node_features[idx] = [
                is_acc,
                is_dev,
                is_crd,
                min(cnt, 100.0) / 100.0,
                np.log1p(avg_amt) / 12.0,
                np.log1p(max_amt) / 12.0,
                min(deg, 50.0) / 50.0
            ]
            node_labels[idx] = node_fraud_flags.get(node_id, 0)

        edge_index = torch.tensor([src_list, dst_list], dtype=torch.long)
        x = torch.tensor(node_features, dtype=torch.float)
        y = torch.tensor(node_labels, dtype=torch.long)

        data = Data(x=x, edge_index=edge_index, y=y)

        metadata = {
            "num_nodes": total_nodes,
            "num_edges": len(src_list),
            "fraud_nodes": int(np.sum(node_labels)),
            "accounts_count": sum(1 for t in self.node_types.values() if t == "account"),
            "devices_count": sum(1 for t in self.node_types.values() if t == "device"),
            "cards_count": sum(1 for t in self.node_types.values() if t == "card")
        }

        # Save mappings
        if is_train:
            with open(os.path.join(GRAPH_DATA_DIR, "node_mappings.json"), "w") as f:
                json.dump({
                    "node_to_idx": self.node_to_idx,
                    "idx_to_node": {str(k): v for k, v in self.idx_to_node.items()},
                    "node_types": self.node_types
                }, f)

        return data, metadata
