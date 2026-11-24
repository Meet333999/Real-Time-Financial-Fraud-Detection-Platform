# ⚡ FraudGuard AI — Quick Start & Demo Guide

Welcome to the **Real-Time Financial Fraud Detection Platform**!  
This quick guide provides two simple methods to evaluate and run the platform:

1. **[Method 1: Local Setup & Running Guide](#-method-1-local-setup--running-guide)** — Run the complete Python backend, ML inference engines, Feast feature store, and React frontend locally.
2. **[Method 2: Instant Cloud Web Demo](#-method-2-instant-cloud-web-demo-zero-setup)** — Open the live Hugging Face deployment immediately in your browser with zero installation.

---

## 🌐 Method 2: Instant Cloud Web Demo (Zero Setup)

If you want to test and review the platform immediately without installing anything locally, use the live cloud application:

- **🚀 Direct Live App (Fullscreen)**:  
  👉 **[https://meet333999-financial-fraud-detection.static.hf.space/index.html](https://meet333999-financial-fraud-detection.static.hf.space/index.html)**
- **📦 Hugging Face Space Repository**:  
  [https://huggingface.co/spaces/Meet333999/financial-fraud-detection](https://huggingface.co/spaces/Meet333999/financial-fraud-detection)

### How to Review & Test the Live Cloud Demo:

1. **Review the Built-In Demo Guide**:
   - Click the green **"Demo Guide"** button in the top navigation bar to open the self-guided architecture overview and pipeline walkthrough.
2. **Test the Real-Time Transaction Simulator**:
   - Click the green **"Simulate Txn"** button in the top-right corner.
   - Click **"Load Normal Merchant Payment"** ($45.00) &rarr; Click *Execute Live Scoring Pipeline* &rarr; Observe immediate **Low Risk (2.1%)** clearance in ~8ms.
   - Click **"Load Fraud Syndicate Extraction"** ($280,000 to a mule account) &rarr; Click *Execute Live Scoring Pipeline* &rarr; Observe **High Risk (98.4%)** with an active 1.25x syndicate multiplier!
3. **Inspect the Live Stream Feed (`Live Monitor`)**:
   - Click **Live Monitor** on the sidebar.
   - Watch transactions stream in real time. Click any row to view its AI Risk Attribution breakdown (XGBoost tree probability vs. GraphSAGE relational risk).
4. **Explore the Graph Intelligence View (`Graph Syndicates`)**:
   - Click **Graph Syndicates** on the sidebar.
   - Interact with the 2-hop topological network showing how 11 mule accounts are connected across a single shared hardware device hub.
5. **Audit Data Drift & Retrain (`Drift & Retraining`)**:
   - Click **Drift & Retraining** on the sidebar to inspect the live Kolmogorov-Smirnov p-value matrix.
   - Click **"Trigger Automated Retraining"** to test background candidate model validation.
6. **Case Management (`Case Workflow`)**:
   - Click **Case Workflow** on the sidebar to audit flagged case logs, update dispositions (Confirm Fraud vs. False Positive), and save audit remarks.

---

## 💻 Method 1: Local Setup & Running Guide

Follow these step-by-step instructions to set up and run the entire platform on your local machine.

### System Prerequisites
- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: v18.0.0 or higher (with `npm`)
- **Git**
- *(Optional)* **Docker & Docker Compose** (for containerized deployment)

---

### Step 1: Clone and Navigate to the Repository

```bash
git clone https://github.com/Meet333999/financial-fraud-detection.git
cd "New folder"
```

---

### Step 2: Set Up Python Virtual Environment

#### On Windows (PowerShell or Command Prompt):
```powershell
python -m venv venv
.\venv\Scripts\activate
```

#### On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

---

### Step 3: Install Backend Dependencies

Upgrade `pip` and install the project requirements:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

*(Note: PyTorch and PyTorch Geometric are included in `requirements.txt`. For CUDA GPU acceleration, install the matching PyTorch wheel from [pytorch.org](https://pytorch.org)).*

---

### Step 4: Initialize the Database & ML Artifacts

The repository comes pre-bundled with trained XGBoost model artifacts, PyG GraphSAGE weights, and seeded SQLite test databases. 

To re-seed or generate fresh test transaction data at any time:

```bash
python scripts/seed_database.py
```

*(Optional: To re-train models from scratch, run `python scripts/train_xgboost.py` and `python scripts/train_graph_model.py`)*.

---

### Step 5: Start the FastAPI Backend Server

Run the backend server using `uvicorn`:

```bash
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

---

### Step 6: Start the React Frontend Dashboard

Open a new terminal window, navigate to the `frontend` folder, and launch the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

- **Analyst Dashboard**: Open `http://localhost:5173` in your browser.
- The frontend will automatically connect to your local backend at `http://localhost:8000`.

---

### Alternative: Run Everything with Docker Compose

If you have Docker installed, you can launch the complete ecosystem (FastAPI, Redis, Kafka, and Frontend) with one single command:

```bash
docker-compose up --build -d
```

- **Frontend Dashboard**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`

To stop the containers:
```bash
docker-compose down
```

---

### Step 7: Running Unit & Integration Tests

To run the automated test suite covering API endpoints, hybrid model inference, and feature stores:

```bash
pytest tests/ -v
```

All 23+ unit and integration tests should pass with 100% green status.

---

## 📊 Feature Comparison: Local vs. Cloud Web

| Feature | Method 1: Local Setup | Method 2: Cloud Web Demo |
| :--- | :---: | :---: |
| **Installation Required** | Yes (Python + Node.js) | **No (Zero setup)** |
| **Instant Evaluation** | ~3-5 mins | **Instant (< 5 seconds)** |
| **Real-Time Transaction Simulator** | ✅ Included | ✅ Included |
| **Interactive Graph Topology Visualizer** | ✅ Included | ✅ Included |
| **Evidently AI Drift Monitoring & Retraining** | ✅ Included | ✅ Included |
| **Analyst Case Disposition Workflow** | ✅ Included | ✅ Included |
| **Interactive Swagger API Docs (`/docs`)** | ✅ Included | Local Only |
| **Host Custom Datasets & Re-train** | ✅ Included | Local Only |

---

## 📬 Need Help or Have Questions?
- Review the full architectural design in **[README.md](file:///c:/Projects/Internship/New%20folder/README.md)**.
- Explore the interactive system guide inside the application by clicking the **"Demo Guide"** button on the top navigation bar.
