"""
Kafka Real-Time Transaction Consumer & Fraud Inference Pipeline
==============================================================
Consumes incoming transactions, enriches features via Feast, executes
hybrid fraud scoring, routes alerts, and tracks real-time P95/P99 latency benchmarks.
"""

import os
import sys
import json
import time
import logging
import threading
from typing import Dict, Any, List, Optional
import numpy as np

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.streaming.kafka_config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC_INCOMING,
    KAFKA_TOPIC_SCORED,
    KAFKA_TOPIC_ALERTS,
    KAFKA_TOPIC_ERRORS,
    KAFKA_CONSUMER_GROUP
)
from backend.streaming.event_bus import LocalEventBus
from backend.models.hybrid_scoring import HybridFraudScorer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class TransactionStreamConsumer:
    """Consumes transactions, scores risk with hybrid model, and measures latency."""

    def __init__(self, bootstrap_servers: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or KAFKA_BOOTSTRAP_SERVERS
        self.scorer = HybridFraudScorer()
        self.local_bus = LocalEventBus()
        self.kafka_consumer = None
        self.use_fallback = False
        self.is_running = False

        # Metrics Tracking
        self.total_processed = 0
        self.total_flagged = 0
        self.total_errors = 0
        self.latencies: List[float] = []
        self._lock = threading.Lock()

        # In-memory buffer for real-time dashboard query & WebSocket push
        self.recent_scored: List[Dict[str, Any]] = []
        self.recent_alerts: List[Dict[str, Any]] = []

    def initialize(self) -> None:
        """Initialize hybrid scorer and Kafka connection."""
        self.scorer.initialize()
        import socket
        # Fast socket probe (0.15s)
        try:
            host, port = (self.bootstrap_servers.split(":") + ["9092"])[:2]
            with socket.create_connection((host, int(port)), timeout=0.15):
                pass
        except (socket.timeout, ConnectionRefusedError, OSError):
            logger.info(f"Kafka broker not reachable at {self.bootstrap_servers}. Using Local Event Bus.")
            self.use_fallback = True
            return

        try:
            from kafka import KafkaConsumer
            self.kafka_consumer = KafkaConsumer(
                KAFKA_TOPIC_INCOMING,
                bootstrap_servers=self.bootstrap_servers,
                group_id=KAFKA_CONSUMER_GROUP,
                auto_offset_reset="latest",
                value_deserializer=lambda m: json.loads(m.decode("utf-8")),
                consumer_timeout_ms=1000
            )
            logger.info(f"Connected to Kafka incoming topic '{KAFKA_TOPIC_INCOMING}'")
        except Exception as e:
            logger.warning(f"Kafka consumer connection failed ({e}). Using Local Event Bus fallback.")
            self.use_fallback = True

    def process_transaction(self, raw_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Validate, score, route, and log latency for a single transaction."""
        t_start = time.perf_counter()

        # 1. Validation & Dead-Letter Handling
        required_fields = ["nameOrig", "amount"]
        is_valid = all(k in raw_data for k in required_fields) and float(raw_data.get("amount", -1)) >= 0
        if not is_valid:
            with self._lock:
                self.total_errors += 1
            error_payload = {
                "error": "Validation failed: missing required fields or negative amount",
                "raw_data": raw_data,
                "timestamp": time.time()
            }
            logger.warning(f"Invalid transaction sent to DLQ: {error_payload}")
            self.local_bus.publish(KAFKA_TOPIC_ERRORS, error_payload)
            return None

        # 2. Hybrid Risk Scoring
        try:
            scored_result = self.scorer.score_transaction(raw_data)
        except Exception as e:
            logger.error(f"Inference error scoring transaction: {e}")
            with self._lock:
                self.total_errors += 1
            self.local_bus.publish(KAFKA_TOPIC_ERRORS, {"error": str(e), "raw": raw_data})
            return None

        total_latency = (time.perf_counter() - t_start) * 1000.0
        scored_result["total_pipeline_latency_ms"] = round(total_latency, 3)

        # 3. Publish to Scored Topic
        self.local_bus.publish(KAFKA_TOPIC_SCORED, scored_result)

        # 4. Route Alerts for High Risk
        if scored_result.get("is_flagged") or scored_result.get("risk_category") == "HIGH_RISK":
            alert_payload = {
                "alert_id": f"ALT_{int(time.time()*1000)}_{self.total_flagged+1}",
                "transaction_id": scored_result["transaction_id"],
                "account_id": scored_result["account_id"],
                "amount": scored_result["amount"],
                "combined_risk_score": scored_result["combined_risk_score"],
                "severity": "HIGH",
                "status": "OPEN",
                "contributing_features": scored_result.get("contributing_features", []),
                "timestamp": scored_result["timestamp"]
            }
            self.local_bus.publish(KAFKA_TOPIC_ALERTS, alert_payload)
            with self._lock:
                self.total_flagged += 1
                self.recent_alerts.append(alert_payload)
                if len(self.recent_alerts) > 500:
                    self.recent_alerts.pop(0)

        # 5. Record Metrics
        with self._lock:
            self.total_processed += 1
            self.latencies.append(total_latency)
            if len(self.latencies) > 2000:
                self.latencies.pop(0)

            self.recent_scored.append(scored_result)
            if len(self.recent_scored) > 500:
                self.recent_scored.pop(0)

        return scored_result

    def poll_and_process(self, max_records: int = 50) -> List[Dict[str, Any]]:
        """Poll incoming topic and process up to max_records."""
        processed_batch = []
        if not self.use_fallback and self.kafka_consumer:
            records = self.kafka_consumer.poll(timeout_ms=500, max_records=max_records)
            for tp, messages in records.items():
                for msg in messages:
                    res = self.process_transaction(msg.value)
                    if res:
                        processed_batch.append(res)
        else:
            for _ in range(max_records):
                item = self.local_bus.consume(KAFKA_TOPIC_INCOMING, timeout=0.01)
                if item:
                    res = self.process_transaction(item["data"])
                    if res:
                        processed_batch.append(res)
                else:
                    break
        return processed_batch

    def start_background_consumer(self) -> None:
        """Runs continuous background listening thread."""
        self.is_running = True

        def _loop():
            logger.info("Background streaming consumer thread started.")
            while self.is_running:
                self.poll_and_process(max_records=20)
                time.sleep(0.02)

        thread = threading.Thread(target=_loop, daemon=True)
        thread.start()

    def get_latency_metrics(self) -> Dict[str, Any]:
        """Compute real measured latency percentiles (Avg, Median, P95, P99)."""
        with self._lock:
            if not self.latencies:
                return {
                    "total_processed": self.total_processed,
                    "total_flagged": self.total_flagged,
                    "avg_latency_ms": 0.0,
                    "median_latency_ms": 0.0,
                    "p95_latency_ms": 0.0,
                    "p99_latency_ms": 0.0,
                    "error_count": self.total_errors
                }

            arr = np.array(self.latencies)
            return {
                "total_processed": self.total_processed,
                "total_flagged": self.total_flagged,
                "error_count": self.total_errors,
                "avg_latency_ms": round(float(np.mean(arr)), 3),
                "median_latency_ms": round(float(np.median(arr)), 3),
                "p95_latency_ms": round(float(np.percentile(arr, 95)), 3),
                "p99_latency_ms": round(float(np.percentile(arr, 99)), 3),
                "min_latency_ms": round(float(np.min(arr)), 3),
                "max_latency_ms": round(float(np.max(arr)), 3)
            }
