"""
Kafka Configuration and Topic Definitions
=========================================
Configures Kafka topics, consumer groups, timeouts, and connection parameters.
"""

import os
from typing import Dict, Any

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC_INCOMING = os.getenv("KAFKA_TOPIC_INCOMING", "transactions-incoming")
KAFKA_TOPIC_SCORED = os.getenv("KAFKA_TOPIC_SCORED", "transactions-scored")
KAFKA_TOPIC_ALERTS = os.getenv("KAFKA_TOPIC_ALERTS", "fraud-alerts")
KAFKA_TOPIC_ERRORS = os.getenv("KAFKA_TOPIC_ERRORS", "transaction-errors")
KAFKA_CONSUMER_GROUP = os.getenv("KAFKA_CONSUMER_GROUP", "fraud-detection-engine")

PRODUCER_CONFIG: Dict[str, Any] = {
    "bootstrap_servers": KAFKA_BOOTSTRAP_SERVERS,
    "acks": "all",
    "retries": 3,
    "max_in_flight_requests_per_connection": 1,
    "linger_ms": 5,
    "batch_size": 16384
}

CONSUMER_CONFIG: Dict[str, Any] = {
    "bootstrap_servers": KAFKA_BOOTSTRAP_SERVERS,
    "group_id": KAFKA_CONSUMER_GROUP,
    "auto_offset_reset": "earliest",
    "enable_auto_commit": True,
    "auto_commit_interval_ms": 1000,
    "session_timeout_ms": 30000,
    "max_poll_records": 100
}
