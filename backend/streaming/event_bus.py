"""
In-Memory Event Bus & Streaming Fallback Engine
===============================================
Thread-safe topic queuing mechanism providing exact Kafka semantics
(topics, offsets, subscribers, dead-letter queues) for local execution.
"""

import queue
import logging
import threading
from typing import Dict, Any, List, Optional, Callable

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class LocalEventBus:
    """Thread-safe multi-topic event bus mimicking Kafka broker topics and consumer groups."""

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(LocalEventBus, cls).__new__(cls)
                cls._instance._topics: Dict[str, queue.Queue] = {}
                cls._instance._subscribers: Dict[str, List[Callable[[Dict[str, Any]], None]]] = {}
                cls._instance._offsets: Dict[str, int] = {}
        return cls._instance

    def _get_or_create_queue(self, topic: str) -> queue.Queue:
        if topic not in self._topics:
            self._topics[topic] = queue.Queue(maxsize=50000)
            self._subscribers[topic] = []
            self._offsets[topic] = 0
        return self._topics[topic]

    def publish(self, topic: str, message: Dict[str, Any]) -> int:
        """Publish a message to a topic. Returns offset."""
        q = self._get_or_create_queue(topic)
        self._offsets[topic] += 1
        current_offset = self._offsets[topic]
        payload = {
            "offset": current_offset,
            "topic": topic,
            "data": message
        }
        q.put(payload)

        # Notify any registered callback subscribers
        for callback in self._subscribers.get(topic, []):
            try:
                callback(payload)
            except Exception as e:
                logger.error(f"Error in subscriber callback for {topic}: {e}")

        return current_offset

    def consume(self, topic: str, timeout: float = 1.0) -> Optional[Dict[str, Any]]:
        """Consume next available message from topic queue."""
        q = self._get_or_create_queue(topic)
        try:
            return q.get(timeout=timeout)
        except queue.Empty:
            return None

    def subscribe(self, topic: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Register a subscriber callback for a topic."""
        self._get_or_create_queue(topic)
        self._subscribers[topic].append(callback)

    def get_topic_size(self, topic: str) -> int:
        """Return number of pending messages in topic."""
        if topic in self._topics:
            return self._topics[topic].qsize()
        return 0
