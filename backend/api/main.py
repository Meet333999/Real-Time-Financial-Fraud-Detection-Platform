"""
FastAPI Fraud Detection Platform Application Entrypoint
======================================================
Integrates REST API routes, WebSockets for live streaming, CORS, and database init.
"""

import os
import sys
from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Path setup
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.database.db import init_db
from backend.api.routes import (
    health,
    transactions,
    alerts,
    cases,
    graph,
    analytics,
    models,
    monitoring,
    streaming
)

# Active WebSocket connections pool
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    init_db()
    # Subscribe local event bus to broadcast scored transactions to WebSocket
    from backend.streaming.event_bus import LocalEventBus
    import asyncio

    bus = LocalEventBus()
    loop = asyncio.get_event_loop()

    def _bus_callback(payload):
        if loop.is_running():
            asyncio.run_coroutine_threadsafe(ws_manager.broadcast(payload["data"]), loop)

    bus.subscribe("transactions-scored", _bus_callback)
    yield
    # Shutdown


app = FastAPI(
    title="Real-Time Financial Fraud Detection Platform API",
    description="Production-grade AI/ML Fraud Scoring, Graph Intelligence, Streaming, and Drift Monitoring Platform.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(graph.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(streaming.router, prefix="/api")

# Real-time WebSocket endpoint for Analyst Live Monitor
@app.websocket("/ws/live-transactions")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Static Reports mount
reports_dir = os.path.join(ROOT_DIR, "data", "reports")
if os.path.exists(reports_dir):
    app.mount("/reports", StaticFiles(directory=reports_dir), name="reports")

# Mount React static distribution if built
frontend_dist = os.path.join(ROOT_DIR, "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "platform": "Real-Time Financial Fraud Detection Platform",
            "status": "OPERATIONAL",
            "docs_url": "/docs",
            "api_health": "/api/health"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.api.main:app", host="0.0.0.0", port=8000, reload=False)
