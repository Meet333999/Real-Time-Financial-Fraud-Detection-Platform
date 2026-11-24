"""
Kafka Transaction Streaming Producer
====================================
Streams transactions in chronological order with configurable replay speed.
Supports full Apache Kafka broker with automatic local event-bus fallback.
"""

import os
import sys
import json
import time
import logging
from typing import Dict, Any, Optional
import pandas as pd

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.streaming.kafka_config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_TOPIC_INCOMING,
    PRODUCER_CONFIG
)
from backend.streaming.event_bus import LocalEventBus

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class TransactionStreamProducer:
    """Produces incoming transactions into Kafka topic or local event bus."""

    def __init__(self, bootstrap_servers: Optional[str] = None):
        self.bootstrap_servers = bootstrap_servers or KAFKA_BOOTSTRAP_SERVERS
        self.kafka_producer = None
        self.use_fallback = False
        self.local_bus = LocalEventBus()
        self._init_producer()

    def _init_producer(self) -> None:
        """Attempt to connect to Apache Kafka; enable local event bus if broker is down."""
        import socket
        # Fast socket probe (0.1s)
        try:
            host, port = (self.bootstrap_servers.split(":") + ["9092"])[:2]
            with socket.create_connection((host, int(port)), timeout=0.15):
                pass
        except (socket.timeout, ConnectionRefusedError, OSError):
            logger.info(f"Kafka broker not reachable at {self.bootstrap_servers}. Using Local Event Bus.")
            self.use_fallback = True
            return

        try:
            from kafka import KafkaProducer
            self.kafka_producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
                request_timeout_ms=2000,
                max_block_ms=2000
            )
            logger.info(f"Connected to Apache Kafka broker at {self.bootstrap_servers}")
        except Exception as e:
            logger.warning(f"Kafka broker connection failed ({e}). Switching to Local Event Bus fallback.")
            self.use_fallback = True

    def send_transaction(self, transaction: Dict[str, Any], topic: Optional[str] = None) -> bool:
        """Send a single transaction to the incoming transactions topic."""
        target_topic = topic or KAFKA_TOPIC_INCOMING

        if not self.use_fallback and self.kafka_producer:
            try:
                future = self.kafka_producer.send(target_topic, value=transaction)
                future.get(timeout=2.0)
                return True
            except Exception as e:
                logger.error(f"Failed to publish to Kafka topic {target_topic}: {e}. Retrying on Local Bus...")
                self.local_bus.publish(target_topic, transaction)
                return True
        else:
            self.local_bus.publish(target_topic, transaction)
            return True

    def stream_historical_transactions(
        self,
        dataset_path: Optional[str] = None,
        limit: Optional[int] = 500,
        delay_seconds: float = 0.05
    ) -> int:
        """
        Replay transactions chronologically from test dataset.
        Simulates live incoming payments at a controlled streaming rate.
        """
        path = dataset_path or os.path.join(ROOT_DIR, "data", "processed", "test.parquet")
        if not os.path.exists(path):
            path = os.path.join(ROOT_DIR, "data", "raw", "paysim.parquet")

        logger.info(f"Streaming historical transactions chronologically from {path} (limit={limit}, delay={delay_seconds}s)...")
        df = pd.read_parquet(path)
        if "step" in df.columns:
            df = df.sort_values(by="step").reset_index(drop=True)

        if limit:
            df = df.head(limit)

        sent_count = 0
        t0 = time.time()

        for _, row in df.iterrows():
            txn = row.to_dict()
            self.send_transaction(txn)
            sent_count += 1
            if delay_seconds > 0:
                time.sleep(delay_seconds)

        elapsed = time.time() - t0
        tps = sent_count / max(0.001, elapsed)
        logger.info(f"Completed streaming {sent_count:,} transactions in {elapsed:.2f}s ({tps:.1f} txns/sec).")
        return sent_count

    def close(self) -> None:
        if self.kafka_producer:
            self.kafka_producer.flush()
            self.kafka_producer.close()
