# API Specification & Integration Reference

The Real-Time Financial Fraud Detection Platform provides a RESTful API and WebSocket interface built with **FastAPI**, **Pydantic v2**, and **SQLAlchemy**.

Interactive OpenAPI/Swagger documentation is available at `http://localhost:8000/docs`.

---

## 1. Base URL & Protocol

- **Local Development**: `http://localhost:8000`
- **Docker Compose**: `http://localhost:8000`
- **Kubernetes Ingress**: `http://fraud-detection.local/api/v1`
- **WebSocket Protocol**: `ws://localhost:8000/ws/live-transactions`

All request and response bodies use standard `application/json` encoding with UTF-8 charset.

---

## 2. Authentication & Headers

Production deployments support Bearer JWT tokens:
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

---

## 3. Core Endpoints

### 3.1 Health & Diagnostics

#### `GET /health`
Returns health status for all sub-components (Database, Feature Store, Model Engine, Streaming Broker).

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-11-24T23:45:00Z",
  "components": {
    "database": "connected",
    "feature_store": "online_sqlite_ready",
    "xgboost_model": "loaded_v1",
    "gnn_model": "loaded_v1",
    "streaming": "active_threadsafe_bus"
  }
}
```

---

### 3.2 Transaction Scoring Engine

#### `POST /api/v1/transactions/score`
Performs synchronous real-time scoring of a single financial transaction through the hybrid XGBoost + GNN pipeline.

**Request Body**:
```json
{
  "step": 721,
  "type": "TRANSFER",
  "amount": 185000.00,
  "nameOrig": "C102938475",
  "oldbalanceOrg": 185000.00,
  "newbalanceOrig": 0.00,
  "nameDest": "C998877665",
  "oldbalanceDest": 1200.00,
  "newbalanceDest": 1200.00,
  "device_id": "DEV_SYN_9918",
  "card_id": "CARD_8821_4401"
}
```

**Response (200 OK)**:
```json
{
  "transaction_id": "TXN_721_C102938475_1732490000",
  "decision": "DECLINE",
  "risk_tier": "HIGH RISK",
  "risk_score": 0.9425,
  "xgboost_score": 0.9850,
  "gnn_score": 0.8638,
  "syndicate_boost_applied": true,
  "latency_ms": 8.74,
  "top_risk_factors": [
    {"feature": "dest_error_balance", "contribution": 0.465, "value": -185000.0},
    {"feature": "orig_empty_flag", "contribution": 0.207, "value": 1.0},
    {"feature": "amount_to_oldbalance_ratio", "contribution": 0.128, "value": 1.0}
  ],
  "graph_context": {
    "entity_id": "DEV_SYN_9918",
    "connected_accounts": 8,
    "syndicate_id": "RING_042"
  }
}
```

#### `POST /api/v1/transactions/batch-score`
Scores an array of transactions in a single vectorized inference call.

**Request Body**:
```json
[
  {
    "step": 721,
    "type": "PAYMENT",
    "amount": 45.20,
    "nameOrig": "C112233445",
    "oldbalanceOrg": 540.00,
    "newbalanceOrig": 494.80,
    "nameDest": "M987654321",
    "oldbalanceDest": 0.00,
    "newbalanceDest": 0.00,
    "device_id": "DEV_USR_1122",
    "card_id": "CARD_5544_2211"
  }
]
```

#### `GET /api/v1/transactions/history`
Query historical transactions with filtering and pagination.

**Query Parameters**:
- `page` (default: 1): Page number
- `page_size` (default: 50, max: 200): Items per page
- `risk_tier` (optional): `LOW`, `MEDIUM`, `HIGH`
- `user_id` (optional): Filter by `nameOrig` or `nameDest`

---

### 3.3 Fraud Alerts & Case Management

#### `GET /api/v1/alerts`
Retrieves generated alerts flagged by the detection engine.

**Query Parameters**:
- `status`: `NEW`, `INVESTIGATING`, `RESOLVED`, `DISMISSED`
- `severity`: `HIGH`, `MEDIUM`

**Response (200 OK)**:
```json
{
  "total": 42,
  "page": 1,
  "page_size": 10,
  "items": [
    {
      "alert_id": "ALT_90214",
      "transaction_id": "TXN_721_C102938475",
      "risk_tier": "HIGH RISK",
      "risk_score": 0.9425,
      "status": "NEW",
      "amount": 185000.00,
      "timestamp": "2026-11-24T23:30:00Z",
      "reason": "Complete origin liquidation and zero recipient credit with shared syndicate device DEV_SYN_9918"
    }
  ]
}
```

#### `PUT /api/v1/alerts/{alert_id}`
Updates an alert's status and records analyst triage notes.

**Request Body**:
```json
{
  "status": "INVESTIGATING",
  "analyst_id": "analyst_sarah_m",
  "notes": "Confirmed mule account pattern; escalating to legal freeze."
}
```

#### `GET /api/v1/cases`
Retrieves formal investigation cases aggregating multiple alerts and accounts.

#### `POST /api/v1/cases`
Manually creates an investigation case.

**Request Body**:
```json
{
  "title": "Syndicate DEV_SYN_9918 Coordinated Extraction",
  "severity": "CRITICAL",
  "primary_entity": "DEV_SYN_9918",
  "linked_alert_ids": ["ALT_90214", "ALT_90218", "ALT_90222"],
  "assigned_to": "analyst_sarah_m"
}
```

---

### 3.4 Graph Intelligence & Fraud Rings

#### `GET /api/v1/graph/entity/{entity_id}`
Returns a 2-hop topological ego-graph for visual rendering in the Analyst Dashboard.

**Response (200 OK)**:
```json
{
  "nodes": [
    {"id": "DEV_SYN_9918", "label": "Device", "risk": 0.86, "type": "device"},
    {"id": "C102938475", "label": "Account", "risk": 0.94, "type": "account"},
    {"id": "C998877665", "label": "Account", "risk": 0.91, "type": "account"},
    {"id": "CARD_8821_4401", "label": "Card", "risk": 0.88, "type": "card"}
  ],
  "edges": [
    {"source": "C102938475", "target": "DEV_SYN_9918", "type": "used_device"},
    {"source": "C998877665", "target": "DEV_SYN_9918", "type": "used_device"},
    {"source": "C102938475", "target": "CARD_8821_4401", "type": "used_card"}
  ]
}
```

#### `GET /api/v1/graph/fraud-rings`
Retrieves top detected multi-entity fraud rings identified by graph mining algorithms.

---

### 3.5 Monitoring & Automated Retraining

#### `GET /api/v1/monitoring/drift/summary`
Returns the latest statistical Kolmogorov-Smirnov drift metrics generated by Evidently AI.

**Response (200 OK)**:
```json
{
  "drift_detected": false,
  "number_of_features": 28,
  "number_of_drifted_features": 1,
  "drift_share": 0.0357,
  "timestamp": "2026-11-24T23:35:00Z",
  "drifted_features": [
    {"feature": "trans_hour", "p_value": 0.041, "stat_test": "Kolmogorov-Smirnov"}
  ]
}
```

#### `GET /api/v1/monitoring/drift/report`
Streams the full interactive HTML visual report produced by Evidently AI.

#### `POST /api/v1/monitoring/retraining/trigger`
Executes candidate model retraining, benchmarking candidate PR-AUC against the active production champion before automated deployment.

---

### 3.6 Streaming & Real-Time Simulation

#### `GET /api/v1/streaming/status`
Returns streaming throughput, consumer lag, and broker connectivity.

#### `POST /api/v1/streaming/simulate`
Generates a burst of synthetic transactions into the streaming pipeline to test end-to-end ingestion under load.

**Request Body**:
```json
{
  "num_transactions": 100,
  "fraud_ratio": 0.05,
  "interval_ms": 50
}
```

---

## 4. WebSocket Feed: `/ws/live-transactions`

### Protocol Flow
1. Client establishes connection to `ws://localhost:8000/ws/live-transactions`.
2. Server accepts and begins streaming incoming scored transactions as JSON frames.
3. Client can send `{ "action": "ping" }` to maintain connection heartbeat.

### Message Payload Example
```json
{
  "event_type": "TRANSACTION_SCORED",
  "timestamp": "2026-11-24T23:45:01.234Z",
  "data": {
    "transaction_id": "TXN_LIVE_4920",
    "amount": 2450.00,
    "type": "CASH_OUT",
    "risk_tier": "HIGH RISK",
    "risk_score": 0.887,
    "nameOrig": "C1928374",
    "nameDest": "C9182736",
    "latency_ms": 7.92
  }
}
```
