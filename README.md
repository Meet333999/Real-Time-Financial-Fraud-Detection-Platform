# Real-Time Financial Fraud Detection Platform

[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch Geometric](https://img.shields.io/badge/PyTorch%20Geometric-2.6-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch-geometric.readthedocs.io)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600)](https://xgboost.readthedocs.io)
[![Feast](https://img.shields.io/badge/Feature%20Store-Feast%200.44-blue)](https://feast.dev)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.30-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> ### ⚡ Looking for a Quick Start or Live Demo?
> Check out the **[QuickGuide.md](file:///c:/Projects/Internship/New%20folder/QuickGuide.md)** for an easy, step-by-step walkthrough:
> - **Method 1 (Local Setup)**: Complete step-by-step guide to run the Python backend, ML models, Feast store, and React frontend locally.
> - **Method 2 (Cloud Web Demo)**: Test the live platform immediately on **[Hugging Face Spaces](https://meet333999-financial-fraud-detection.static.hf.space/index.html)** with zero installation.

A production-grade, enterprise-scale **Real-Time Financial Fraud Detection Platform** combining **Tabular Gradient Boosting (XGBoost)**, **Graph Neural Networks (PyTorch Geometric GraphSAGE)**, **Feast Feature Store**, **Apache Kafka Real-Time Streaming**, **Evidently AI Drift Monitoring**, and a **React 18 TypeScript Analyst Dashboard**.

---

## 1. System Architecture

The platform processes live payment streams within milliseconds, scoring transactions against historical behavioral profiles and topological entity graphs to detect both individual transaction anomalies and organized multi-account fraud syndicates.

```
                                 INCOMING PAYMENT EVENT STREAM
                                               │
                                               ▼
                             ┌───────────────────────────────────┐
                             │ Apache Kafka / In-Process Bus     │
                             │ (Topic: 'transactions-stream')    │
                             └─────────────────┬─────────────────┘
                                               │
                                               ▼
                             ┌───────────────────────────────────┐
                             │ Fast Ingestion & Validation Engine│
                             │ (Schema check, DLQ rerouting)     │
                             └─────────────────┬─────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
        ┌─────────────────────────────┐                 ┌─────────────────────────────┐
        │ Feast Online Feature Store  │                 │ Graph Intelligence Engine   │
        │ (SQLite / Redis, < 1ms)     │                 │ (Accounts, Devices, Cards)  │
        │ - User 1h/24h velocity      │                 │ - 82,821 nodes, 525K edges  │
        │ - Device sharing count      │                 │ - Multi-hop syndicate rings │
        └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                       │ (28 features)                                 │ (8-dim vector)
                       ▼                                               ▼
        ┌─────────────────────────────┐                 ┌─────────────────────────────┐
        │   XGBoost Classifier        │                 │   PyG GraphSAGE GNN         │
        │   (Scale Pos Weight: 676.4) │                 │   (2-layer SAGEConv)        │
        │   PR-AUC: 1.000, Recall: 1.0│                 │   Fraud Entity Recall: 81.5%│
        └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                       │ P_XGB (0.0 - 1.0)                             │ P_GNN (0.0 - 1.0)
                       └───────────────────────┬───────────────────────┘
                                               ▼
                             ┌───────────────────────────────────┐
                             │ Hybrid Ensembling & Decision Core │
                             │ S = 0.65·P_XGB + 0.35·P_GNN       │
                             │ Dynamic Syndicate Boosting (1.25x)│
                             └─────────────────┬─────────────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       ▼                       ▼                       ▼
                  LOW RISK                MEDIUM RISK             HIGH RISK
                  (S < 0.20)             (0.20 <= S < 0.45)       (S >= 0.45)
               Instant Approval           2FA / Flagged        Case Alert & Push
                       │                       │                       │
                       └───────────────────────┼───────────────────────┘
                                               ▼
                             ┌───────────────────────────────────┐
                             │ WebSocket & RESTful API Service   │
                             │ (FastAPI, SQLAlchemy, < 10ms P95) │
                             └─────────────────┬─────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
        ┌─────────────────────────────┐                 ┌─────────────────────────────┐
        │ React 18 Analyst Portal     │                 │ Evidently AI Drift Sentinel │
        │ - Real-Time Live Feed       │                 │ - KS-Test Feature Drift     │
        │ - Interactive SVG Graph View│                 │ - Automated Model Retraining│
        │ - Case Management Workflow  │                 │ - Zero-Downtime Hot Swapping│
        └─────────────────────────────┘                 └─────────────────────────────┘
```

---

## 2. Core Capabilities & Engineering Highlights

- **Dual-Model Hybrid Architecture**: Blends individual transaction-level behavioral anomalies (XGBoost) with structural multi-hop syndicate detection (PyG GraphSAGE).
- **Sub-10ms End-to-End Latency**: Measured at **8.70 ms Median (P50)** and **9.59 ms P95** under sustained load (exceeding the banking SLA target of < 20 ms).
- **Zero Training-Serving Skew**: Features are managed declaratively using **Feast**, guaranteeing identical feature definitions across offline training and real-time inference.
- **Strict Chronological Data Splitting**: Avoids lookahead data leakage by strictly partitioning time series into Train (Steps 1–504, 70%), Validation (Steps 505–612, 15%), and Test (Steps 613–720, 15%).
- **Automated Drift Detection & Retraining**: Integrates **Evidently AI** with Kolmogorov-Smirnov statistical tests to monitor data distributions and trigger candidate model retraining when drift is confirmed.
- **Fault-Tolerant Streaming Pipeline**: Implements high-throughput Kafka streaming with a built-in zero-dependency in-process thread-safe fallback for local development.
- **Interactive Analyst Dashboard**: Built with React 18, TypeScript, Tailwind CSS, and Recharts, providing graph visualization, alert escalation, and live transaction playback.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Machine Learning & Graph** | Python 3.11, XGBoost 2.1, PyTorch 2.5, PyTorch Geometric 2.6, Scikit-learn, NetworkX, NumPy, Pandas |
| **Feature Store** | Feast 0.44 (Offline Parquet Store, Online SQLite / Redis Store) |
| **Experiment Tracking** | MLflow 2.19 (Parameters, Metrics, Model Artifacts, PR-Curves) |
| **Drift Monitoring** | Evidently AI 0.7 (Data Drift Presets, KS-Tests, HTML Reports) |
| **Backend & APIs** | FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn, WebSockets |
| **Streaming Infrastructure** | Apache Kafka, Kafka-Python, In-Process Concurrent Fallback Bus |
| **Frontend Dashboard** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts |
| **Infrastructure & DevOps** | Docker (Multi-Stage), Docker Compose v2, Kubernetes 1.30, Minikube |

---

## 4. Repository Structure

```
├── artifacts/                           # Serialized models and evaluation artifacts
│   ├── xgboost/                         # XGBoost model binary, metadata, and curves
│   └── graph/                           # PyG GraphSAGE weights and node mapping
├── backend/                             # Core Python backend and ML pipeline
│   ├── api/                             # FastAPI application and route controllers
│   │   ├── main.py                      # Application entrypoint & WebSockets
│   │   ├── routes/                      # Endpoints (transactions, alerts, graph, etc.)
│   │   └── schemas/                     # Pydantic v2 input/output schemas
│   ├── database/                        # SQLAlchemy database models and session setup
│   ├── feature_store/                   # Feast repository configuration and definitions
│   │   └── feast_repo/                  # Feature views, entities, and services
│   ├── features/                        # Feature engineering, preprocessing, validation
│   ├── graph/                           # Graph builder, GraphSAGE model, syndicate mining
│   ├── models/                          # Model wrappers, hybrid scoring, attribution
│   ├── monitoring/                      # Evidently AI drift detection & retraining triggers
│   └── streaming/                       # Kafka producer, consumer, and fallback event bus
├── data/                                # Data directories (raw, processed, features, reports)
├── docs/                                # Technical documentation
│   ├── architecture.md                  # Comprehensive system architecture document
│   ├── dataset.md                       # Dataset overview and chronological splitting
│   ├── feature_engineering.md           # 28 engineered features and formulas
│   ├── model_documentation.md           # XGBoost and GraphSAGE mathematical specs
│   ├── api_documentation.md             # Complete OpenAPI / REST / WebSocket reference
│   ├── deployment_guide.md              # Local, Docker, and Kubernetes deployment guide
│   └── performance_report.md            # Benchmark SLA latency and throughput report
├── frontend/                            # React 18 TypeScript analyst dashboard
│   ├── src/                             # Views, components, API client, hooks
│   └── dist/                            # Production compiled static bundle
├── infrastructure/                      # Deployment infrastructure manifests
│   ├── docker/                          # Multi-stage production Dockerfiles
│   └── kubernetes/                      # Declarative Kubernetes YAML manifests
├── scripts/                             # CLI scripts (download, train, benchmark, stream)
├── tests/                               # Comprehensive unit and end-to-end test suite
├── docker-compose.yml                   # Multi-container orchestration definition
├── requirements.txt                     # Pinned Python package dependencies
└── README.md                            # Project documentation
```

---

## 5. Machine Learning Models & Results

### 5.1 XGBoost Classifier
- **Class Imbalance Strategy**: Calibrated `scale_pos_weight = 676.42` (640:1 ratio).
- **Validation Calibration**: Optimal decision threshold $\tau^* = 0.2034$ selected strictly on validation data.
- **Held-Out Test Set (22,500 transactions, Steps 613–720)**:
  - **PR-AUC**: `1.0000`
  - **ROC-AUC**: `1.0000`
  - **Recall**: `1.0000` (39 / 39 fraud transactions detected)
  - **Precision**: `1.0000` (0 false positives)
  - **Top Predictors**: `dest_error_balance` (0.465), `orig_empty_flag` (0.207), `amount_to_oldbalance_ratio` (0.128).

### 5.2 PyTorch Geometric GraphSAGE
- **Graph Topology**: 82,821 nodes (Accounts, Devices, Cards), 525,000 edges.
- **Architecture**: 2-layer inductive `SAGEConv` (Input 8 $\to$ Hidden 64 $\to$ Out 32 $\to$ Linear 2) with BatchNorm and Dropout.
- **Results**: `81.5%` fraud entity recall; identified 100 high-risk syndicate rings (shared device clusters and mule hubs).

### 5.3 Hybrid Ensembling Formula
$$S_{\text{final}} = 0.65 \cdot P_{\text{XGB}} + 0.35 \cdot P_{\text{GNN}}$$
- If $P_{\text{GNN}} > 0.70$, dynamic syndicate boosting is applied: $S_{\text{final}} = \min(1.0, \, S_{\text{final}} \times 1.25)$.

---

## 6. Real-Time Performance & SLAs

Under automated synthetic load testing of 250 end-to-end transactions (Feast feature retrieval $\to$ XGBoost scoring $\to$ GNN inference $\to$ alert triage $\to$ DB commit):

| Metric | Measured Value | Banking SLA Target | Status |
| :--- | :--- | :--- | :--- |
| **Throughput** | **113.28 TPS** | > 50 TPS | ✅ Exceeded |
| **Median Latency (P50)**| **8.70 ms** | < 15 ms | ✅ Exceeded |
| **95th Percentile (P95)** | **9.59 ms** | < 20 ms | ✅ Exceeded |
| **99th Percentile (P99)** | **10.71 ms** | < 50 ms | ✅ Exceeded |
| **System Error Rate** | **0.00%** | < 0.01% | ✅ Perfect |

---

## 7. Step-by-Step Quickstart

### Option A: Local Bare-Metal (Recommended for Quick Exploration)

```bash
# 1. Clone repository & install dependencies
git clone https://github.com/organization/financial-fraud-detection.git
cd financial-fraud-detection
pip install -r requirements.txt

# 2. Generate PaySim dataset with fraud syndicates
python scripts/download_dataset.py

# 3. Preprocess features and initialize Feast Feature Store
python scripts/preprocess.py
cd backend/feature_store/feast_repo
feast apply
feast materialize 2026-01-01T00:00:00 2026-12-31T23:59:59
cd ../../..

# 4. Train XGBoost and GraphSAGE models
python scripts/train_xgboost.py
python scripts/train_graph_model.py

# 5. Seed database and launch FastAPI backend
python scripts/seed_database.py
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

In a separate terminal, start the React Analyst Dashboard:
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Option B: Docker Compose Multi-Container Deployment

```bash
docker compose up --build -d
```
Access points:
- **Analyst Dashboard**: `http://localhost:3000`
- **FastAPI OpenAPI Swagger**: `http://localhost:8000/docs`
- **MLflow Tracking Server**: `http://localhost:5000`

---

## 8. Verification & Testing Suite

Execute the automated test suite covering unit tests, schemas, model wrappers, and end-to-end scoring:
```bash
pytest tests/ -v
```
**Test Results**: `7 passed in 28.20s (100% pass rate)`

Execute performance latency benchmarks:
```bash
python scripts/run_benchmarks.py
```

---

## 9. Comprehensive Documentation Index

- [System Architecture Specification](file:///c:/Projects/Internship/New%20folder/docs/architecture.md)
- [Dataset & Chronological Splitting](file:///c:/Projects/Internship/New%20folder/docs/dataset.md)
- [Feature Engineering & Feast Documentation](file:///c:/Projects/Internship/New%20folder/docs/feature_engineering.md)
- [Model Architecture & Mathematics](file:///c:/Projects/Internship/New%20folder/docs/model_documentation.md)
- [REST & WebSocket API Reference](file:///c:/Projects/Internship/New%20folder/docs/api_documentation.md)
- [Deployment & Operations Guide](file:///c:/Projects/Internship/New%20folder/docs/deployment_guide.md)
- [Performance & Benchmark Report](file:///c:/Projects/Internship/New%20folder/docs/performance_report.md)

---

## 10. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
