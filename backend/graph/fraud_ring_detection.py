"""
Fraud Ring and Graph Intelligence Detection Engine
===================================================
Detects coordinated fraud networks, account sharing, mule consolidation hubs,
and dense suspicious transaction subgraphs using topological graph analytics.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
import networkx as nx
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GRAPH_DATA_DIR = os.path.join(ROOT_DIR, "data", "graph")
os.makedirs(GRAPH_DATA_DIR, exist_ok=True)


class FraudRingDetector:
    """Detects multi-entity fraud syndicates and clusters in transaction graphs."""

    def __init__(self):
        self.graph = nx.Graph()
        self.rings: List[Dict[str, Any]] = []

    def build_networkx_graph(self, df: pd.DataFrame) -> nx.Graph:
        """Constructs an undirected NetworkX graph with typed nodes and edges."""
        self.graph.clear()
        logger.info(f"Building NetworkX graph from {len(df):,} transactions...")

        for _, row in df.iterrows():
            orig = str(row["nameOrig"])
            dest = str(row["nameDest"])
            device = str(row.get("device_id", "DEV_UNKNOWN"))
            card = str(row.get("card_id", "CARD_UNKNOWN"))
            amt = float(row.get("amount", 0.0))
            fraud = int(row.get("isFraud", 0))

            # Add nodes with attributes
            self.graph.add_node(orig, node_type="account", fraud=fraud)
            self.graph.add_node(dest, node_type="account", fraud=fraud)
            self.graph.add_node(device, node_type="device", fraud=fraud)
            self.graph.add_node(card, node_type="card", fraud=fraud)

            # Add edges with attributes
            self.graph.add_edge(orig, dest, edge_type="transacts_with", amount=amt, fraud=fraud)
            self.graph.add_edge(orig, device, edge_type="uses_device")
            self.graph.add_edge(orig, card, edge_type="uses_card")

        logger.info(f"NetworkX graph built: {self.graph.number_of_nodes():,} nodes, {self.graph.number_of_edges():,} edges.")
        return self.graph

    def detect_fraud_rings(self, min_ring_size: int = 3) -> List[Dict[str, Any]]:
        """
        Detects specific fraud patterns:
        1. Shared Device Rings (accounts connected via 1 common device)
        2. Shared Card Rings (accounts connected via 1 common card)
        3. Mule Consolidation Hubs (in-degree hub with multiple feeder accounts)
        4. Dense Suspicious Subgraphs / Connected Components with confirmed fraud
        """
        logger.info("Analyzing graph topology for fraud rings...")
        detected_rings = []
        ring_counter = 1

        # Pattern 1: Shared Device Rings
        device_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "device"]
        for dev in device_nodes:
            neighbors = list(self.graph.neighbors(dev))
            account_neighbors = [n for n in neighbors if self.graph.nodes[n].get("node_type") == "account"]
            if len(account_neighbors) >= 3:
                # Suspicious device shared by multiple accounts
                total_volume = 0.0
                fraud_count = 0
                for acc in account_neighbors:
                    if self.graph.nodes[acc].get("fraud") == 1:
                        fraud_count += 1
                    for _, _, edge_data in self.graph.edges(acc, data=True):
                        total_volume += edge_data.get("amount", 0.0)

                risk_score = min(0.99, 0.50 + (len(account_neighbors) * 0.04) + (fraud_count * 0.15))
                ring_id = f"RING_DEV_{ring_counter:03d}"
                ring_counter += 1

                nodes_payload = [{"id": dev, "type": "device", "is_hub": True}] + [
                    {"id": acc, "type": "account", "is_fraud": bool(self.graph.nodes[acc].get("fraud", 0))}
                    for acc in account_neighbors
                ]
                edges_payload = [{"source": acc, "target": dev, "type": "uses_device"} for acc in account_neighbors]

                detected_rings.append({
                    "ring_id": ring_id,
                    "ring_name": f"Shared Device Syndicate ({dev})",
                    "pattern_type": "SHARED_DEVICE",
                    "risk_score": round(risk_score, 4),
                    "severity": "HIGH" if risk_score >= 0.70 else "MEDIUM",
                    "member_count": len(account_neighbors) + 1,
                    "accounts_count": len(account_neighbors),
                    "primary_hub": dev,
                    "hub_type": "device",
                    "total_transaction_volume": round(total_volume, 2),
                    "confirmed_fraud_count": fraud_count,
                    "subgraph": {
                        "nodes": nodes_payload,
                        "edges": edges_payload
                    }
                })

        # Pattern 2: Shared Card Rings
        card_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "card"]
        for crd in card_nodes:
            neighbors = list(self.graph.neighbors(crd))
            account_neighbors = [n for n in neighbors if self.graph.nodes[n].get("node_type") == "account"]
            if len(account_neighbors) >= 3:
                total_volume = 0.0
                fraud_count = 0
                for acc in account_neighbors:
                    if self.graph.nodes[acc].get("fraud") == 1:
                        fraud_count += 1
                    for _, _, edge_data in self.graph.edges(acc, data=True):
                        total_volume += edge_data.get("amount", 0.0)

                risk_score = min(0.99, 0.55 + (len(account_neighbors) * 0.05) + (fraud_count * 0.15))
                ring_id = f"RING_CRD_{ring_counter:03d}"
                ring_counter += 1

                nodes_payload = [{"id": crd, "type": "card", "is_hub": True}] + [
                    {"id": acc, "type": "account", "is_fraud": bool(self.graph.nodes[acc].get("fraud", 0))}
                    for acc in account_neighbors
                ]
                edges_payload = [{"source": acc, "target": crd, "type": "uses_card"} for acc in account_neighbors]

                detected_rings.append({
                    "ring_id": ring_id,
                    "ring_name": f"Card Recycling Ring ({crd})",
                    "pattern_type": "CARD_RECYCLING",
                    "risk_score": round(risk_score, 4),
                    "severity": "HIGH" if risk_score >= 0.70 else "MEDIUM",
                    "member_count": len(account_neighbors) + 1,
                    "accounts_count": len(account_neighbors),
                    "primary_hub": crd,
                    "hub_type": "card",
                    "total_transaction_volume": round(total_volume, 2),
                    "confirmed_fraud_count": fraud_count,
                    "subgraph": {
                        "nodes": nodes_payload,
                        "edges": edges_payload
                    }
                })

        # Pattern 3: Mule Consolidation Hubs
        account_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "account"]
        for acc in account_nodes:
            neighbors = list(self.graph.neighbors(acc))
            transacting_accounts = [
                n for n in neighbors
                if self.graph.nodes[n].get("node_type") == "account"
                and self.graph.has_edge(n, acc)
                and self.graph.edges[n, acc].get("edge_type") == "transacts_with"
            ]
            if len(transacting_accounts) >= 5:
                fraud_count = sum(1 for n in transacting_accounts if self.graph.nodes[n].get("fraud") == 1)
                total_volume = sum(self.graph.edges[n, acc].get("amount", 0.0) for n in transacting_accounts)

                risk_score = min(0.99, 0.60 + (fraud_count * 0.12) + (len(transacting_accounts) * 0.02))
                ring_id = f"RING_MULE_{ring_counter:03d}"
                ring_counter += 1

                nodes_payload = [{"id": acc, "type": "account", "is_hub": True, "is_mule": True}] + [
                    {"id": fdr, "type": "account", "is_feeder": True} for fdr in transacting_accounts
                ]
                edges_payload = [{"source": fdr, "target": acc, "type": "transacts_with"} for fdr in transacting_accounts]

                detected_rings.append({
                    "ring_id": ring_id,
                    "ring_name": f"Mule Inflow Hub ({acc})",
                    "pattern_type": "MULE_CONSOLIDATION",
                    "risk_score": round(risk_score, 4),
                    "severity": "HIGH" if risk_score >= 0.70 else "MEDIUM",
                    "member_count": len(transacting_accounts) + 1,
                    "accounts_count": len(transacting_accounts) + 1,
                    "primary_hub": acc,
                    "hub_type": "account",
                    "total_transaction_volume": round(total_volume, 2),
                    "confirmed_fraud_count": fraud_count,
                    "subgraph": {
                        "nodes": nodes_payload,
                        "edges": edges_payload
                    }
                })

        # Filter to confirmed suspicious and high-risk rings only (risk >= 0.70 or confirmed fraud)
        high_risk_rings = [r for r in detected_rings if r["risk_score"] >= 0.70 or r["confirmed_fraud_count"] > 0]
        high_risk_rings.sort(key=lambda r: (r["confirmed_fraud_count"], r["risk_score"]), reverse=True)
        self.rings = high_risk_rings[:100]
        logger.info(f"Retained top {len(self.rings)} high-risk fraud rings across graph topology.")

        # Save to graph data directory
        out_path = os.path.join(GRAPH_DATA_DIR, "detected_fraud_rings.json")
        with open(out_path, "w") as f:
            json.dump(self.rings, f, indent=2)
        logger.info(f"Saved detected fraud rings to: {out_path}")

        return self.rings

    def get_account_subgraph(self, account_id: str, depth: int = 2) -> Dict[str, Any]:
        """Extract multi-hop ego network for an account for the analyst dashboard."""
        if account_id not in self.graph:
            return {"nodes": [], "edges": [], "account_id": account_id, "found": False}

        ego = nx.ego_graph(self.graph, account_id, radius=depth)
        nodes = []
        for n, attrs in ego.nodes(data=True):
            nodes.append({
                "id": str(n),
                "type": attrs.get("node_type", "account"),
                "is_fraud": bool(attrs.get("fraud", 0)),
                "is_target": (str(n) == account_id)
            })

        edges = []
        for u, v, attrs in ego.edges(data=True):
            edges.append({
                "source": str(u),
                "target": str(v),
                "type": attrs.get("edge_type", "connected_to"),
                "amount": attrs.get("amount", 0.0)
            })

        return {
            "account_id": account_id,
            "found": True,
            "num_nodes": len(nodes),
            "num_edges": len(edges),
            "nodes": nodes,
            "edges": edges
        }
