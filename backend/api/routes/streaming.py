"""
Streaming Control and Telemetry Routes
======================================
"""

import threading
import time
from typing import Optional
from fastapi import APIRouter
from backend.streaming.producer import TransactionStreamProducer
from backend.streaming.consumer import TransactionStreamConsumer

router = APIRouter(tags=["Streaming"])

producer = TransactionStreamProducer()
consumer = TransactionStreamConsumer()
consumer.initialize()

streaming_thread: Optional[threading.Thread] = None
is_streaming_active = False


def _stream_worker(delay: float = 0.05, limit: int = 200):
    global is_streaming_active
    sent = 0
    while is_streaming_active and sent < limit:
        producer.stream_historical_transactions(limit=1, delay_seconds=0.0)
        consumer.poll_and_process(max_records=5)
        sent += 1
        time.sleep(delay)
    is_streaming_active = False


@router.post("/streaming/start")
def start_transaction_stream(rate_delay: float = 0.05, limit: int = 500):
    """Start streaming transactions into the Kafka producer/consumer pipeline."""
    global is_streaming_active, streaming_thread
    if is_streaming_active:
        return {"status": "ALREADY_STREAMING", "message": "Transaction streaming is already active."}

    is_streaming_active = True
    streaming_thread = threading.Thread(target=_stream_worker, args=(rate_delay, limit), daemon=True)
    streaming_thread.start()

    return {
        "status": "STREAMING_STARTED",
        "rate_delay": rate_delay,
        "transaction_limit": limit
    }


@router.post("/streaming/stop")
def stop_transaction_stream():
    """Halt active transaction streaming."""
    global is_streaming_active
    is_streaming_active = False
    return {"status": "STREAMING_STOPPED"}


@router.get("/streaming/status")
def get_streaming_telemetry():
    """Retrieve live streaming throughput, consumer backlog, and latency percentiles."""
    latency_metrics = consumer.get_latency_metrics()
    return {
        "is_active": is_streaming_active,
        "performance": latency_metrics,
        "recent_alerts": consumer.recent_alerts[-10:],
        "recent_scored": consumer.recent_scored[-10:]
    }
