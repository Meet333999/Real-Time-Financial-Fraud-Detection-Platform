# Production Deployment & Operations Guide

This guide details instructions for deploying, managing, and operating the Real-Time Financial Fraud Detection Platform across local environments, Docker Compose, and Kubernetes (Minikube / Cloud EKS/GKE).

---

## 1. Architecture Deployment Topologies

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Kubernetes Ingress (Port 80)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  Frontend (React)    │                          │   FastAPI Backend    │
│  Port 3000 (3 pods)  │                          │   Port 8000 (HPA)    │
└──────────────────────┘                          └──────────┬───────────┘
                                                             │
           ┌──────────────────────┬──────────────────────────┼─────────────────────────┐
           ▼                      ▼                          ▼                         ▼
┌──────────────────────┐┌──────────────────┐┌────────────────────────┐┌────────────────────────┐
│ PostgreSQL (State)   ││ Redis (Cache)    ││ Apache Kafka (Events)  ││ Feast Online Store     │
│ Port 5432            ││ Port 6379        ││ Port 9092              ││ SQLite / Redis Cluster │
└──────────────────────┘└──────────────────┘└────────────────────────┘└────────────────────────┘
```

---

## 2. Environment Prerequisites

- **Python**: `3.10` or `3.11` (Tested on Python 3.11.9)
- **Node.js**: `v18.0.0+` (Tested on Node.js v22.14.0, npm 11.12.0)
- **Operating Systems**: Linux (Ubuntu 20.04+), macOS (Apple Silicon / Intel), Windows 10/11
- **Optional**: Docker 24+, Docker Compose v2, Kubernetes / Minikube v1.30+

---

## 3. Local Native Bare-Metal Execution

For environments where container engines are not running, the platform natively executes with zero degraded functionality through automatic in-process fallbacks.

### Step 3.1 Clone & Environment Initialization
```bash
# Clone the repository
git clone https://github.com/organization/financial-fraud-detection.git
cd financial-fraud-detection

# Create and activate virtual environment
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3.2 Dataset Generation & Feature Engineering
```bash
# 1. Synthesize 150,000 transaction PaySim dataset with fraud syndicates
python scripts/download_dataset.py

# 2. Run chronological feature transformations and validation
python scripts/preprocess.py
```

### Step 3.3 Initialize Feast Feature Store
```bash
cd backend/feature_store/feast_repo

# Register entities, feature views, and services
feast apply

# Materialize offline Parquet features into online store (SQLite)
feast materialize 2026-01-01T00:00:00 2026-12-31T23:59:59

cd ../../..
```

### Step 3.4 Train Machine Learning & Graph Models
```bash
# 1. Train XGBoost classifier with scale_pos_weight
python scripts/train_xgboost.py

# 2. Train PyTorch Geometric GraphSAGE for fraud syndicate detection
python scripts/train_graph_model.py
```

### Step 3.5 Database Seeding & Backend Launch
```bash
# Seed SQLite database with baseline cases, alerts, and transaction history
python scripts/seed_database.py

# Launch FastAPI backend server (port 8000)
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3.6 Frontend Compilation & Launch
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
# The dashboard opens at http://localhost:5173
```

---

## 4. Docker Compose Multi-Container Deployment

To deploy the unified microservices stack locally using Docker Compose:

### Step 4.1 Launch All Services
```bash
docker compose up --build -d
```

### Step 4.2 Exposed Service Endpoints
| Service | Internal Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | 80 | `http://localhost:3000` | Analyst Web Dashboard |
| **Backend API** | 8000 | `http://localhost:8000` | FastAPI Inference Engine & Docs |
| **Kafka Broker** | 9092 | `localhost:9092` | Event Streaming Pipeline |
| **PostgreSQL** | 5432 | `localhost:5432` | Relational Storage |
| **Redis** | 6379 | `localhost:6379` | Fast Key-Value Cache |
| **MLflow UI** | 5000 | `http://localhost:5000` | Experiment Tracking UI |

### Step 4.3 Container Health Check & Logs
```bash
# Verify container health
docker compose ps

# View streaming logs
docker compose logs -f backend consumer
```

---

## 5. Kubernetes & Minikube Deployment

The platform provides complete declarative Kubernetes manifests located in `infrastructure/kubernetes/`.

### Step 5.1 Start Minikube & Enable Ingress
```bash
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
minikube addons enable metrics-server
```

### Step 5.2 Ordered Manifest Application
Apply the Kubernetes manifests in strict sequence:
```bash
# 1. Dedicated Namespace
kubectl apply -f infrastructure/kubernetes/00-namespace.yaml

# 2. ConfigMaps and Secrets
kubectl apply -f infrastructure/kubernetes/01-configmap.yaml
kubectl apply -f infrastructure/kubernetes/02-secrets.yaml

# 3. Persistent Volumes
kubectl apply -f infrastructure/kubernetes/03-pvc.yaml

# 4. Stateful Services (Database, Cache, Kafka Broker)
kubectl apply -f infrastructure/kubernetes/04-postgres.yaml
kubectl apply -f infrastructure/kubernetes/05-redis.yaml
kubectl apply -f infrastructure/kubernetes/06-kafka.yaml

# 5. Core Applications (Backend & Frontend)
kubectl apply -f infrastructure/kubernetes/07-backend.yaml
kubectl apply -f infrastructure/kubernetes/08-frontend.yaml

# 6. Ingress Routing & Horizontal Pod Autoscaler (HPA)
kubectl apply -f infrastructure/kubernetes/09-ingress-and-hpa.yaml
```

### Step 5.3 Verify Pod Status & Ingress
```bash
kubectl get pods -n fraud-detection -o wide
kubectl get svc -n fraud-detection
kubectl get hpa -n fraud-detection
```

Map `fraud-detection.local` to your Minikube IP:
```bash
echo "$(minikube ip) fraud-detection.local" | sudo tee -a /etc/hosts
```
Access the application at `http://fraud-detection.local`.

---

## 6. Performance SLA & Verification

Execute the automated latency benchmark script to verify compliance with the `< 20 ms` P95 SLA:
```bash
python scripts/run_benchmarks.py
```

### Benchmark Results on Reference Hardware:
- **Total Invocations**: 250 requests
- **Throughput**: 113.28 TPS
- **Median Latency (P50)**: `8.70 ms`
- **P95 Latency**: `9.59 ms` (Target: < 20 ms)
- **P99 Latency**: `10.71 ms`
- **Accuracy / Zero Failures**: 0 errors, 100% payload integrity

---

## 7. Operational Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `KafkaTimeoutError` | Broker unavailable or slow network probe | Built-in fallback activates automatically (`EventBus`). In production, verify `KAFKA_BOOTSTRAP_SERVERS` in `.env`. |
| `OnlineStoreNotMaterialized` | Feast online store missing features | Execute `feast materialize-incremental` from `backend/feature_store/feast_repo`. |
| `Torch CUDA Out of Memory` | Large batch sizes on GPU | Set `device = 'cpu'` or reduce `batch_size` in `backend/graph/graph_model.py`. |
| `Evidently Version Warnings` | API changes in 0.7.x | Ensure `from evidently import Report` and `snapshot = report.run()` are utilized as configured. |
