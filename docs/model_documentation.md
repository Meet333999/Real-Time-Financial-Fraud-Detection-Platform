# Model Documentation & Technical Specifications

This document provides a comprehensive technical overview of the machine learning and graph neural network models deployed in the Real-Time Financial Fraud Detection Platform.

---

## 1. System Architecture Overview

The detection platform employs a two-tier hybrid architecture combining tabular gradient boosting with deep graph representation learning:

```
                          Incoming Transaction
                                   │
                 ┌─────────────────┴─────────────────┐
                 ▼                                   ▼
      ┌──────────────────────┐            ┌──────────────────────┐
      │   Tabular Features   │            │   Graph Entity Map   │
      │   (Feast Store &     │            │   (Accounts, Devices,│
      │   Feature Pipeline)  │            │    Cards, Edges)     │
      └──────────┬───────────┘            └──────────┬───────────┘
                 │ (28 features)                     │ (8-dim node vector)
                 ▼                                   ▼
      ┌──────────────────────┐            ┌──────────────────────┐
      │  XGBoost Classifier  │            │ PyG GraphSAGE Model  │
      │  (Transaction Risk)  │            │  (Entity Ring Risk)  │
      └──────────┬───────────┘            └──────────┬───────────┘
                 │ P_XGB (0.0 - 1.0)                 │ P_GNN (0.0 - 1.0)
                 └─────────────────┬─────────────────┘
                                   ▼
                      ┌─────────────────────────┐
                      │  Hybrid Scoring Engine  │
                      │  S = 0.65·P_XGB +       │
                      │      0.35·P_GNN         │
                      └────────────┬────────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 ▼                 ▼                 ▼
             Low Risk         Medium Risk        High Risk
            (< 0.20)         (0.20 - 0.45)       (>= 0.45)
          Auto-Approve       Flag / Monitor      Alert Case
```

---

## 2. Model Tier 1: XGBoost Transaction Classifier

### 2.1 Model Specification
- **Algorithm**: Extreme Gradient Boosting (`XGBClassifier`)
- **Objective**: `binary:logistic`
- **Evaluation Metric**: `aucpr` (Area under Precision-Recall Curve)
- **Model Artifact**: `artifacts/xgboost/xgboost_fraud_model.json`
- **Metadata**: `artifacts/xgboost/model_metadata.json`

### 2.2 Imbalance Management (`scale_pos_weight`)
In financial fraud, fraudulent events represent a minuscule fraction of total volume (0.156% in the 150,000 transaction dataset, or ~640:1 negative-to-positive ratio).
Standard cross-entropy loss causes traditional models to predict the majority class. We calibrate:
$$\text{scale\_pos\_weight} = \frac{N_{\text{negative}}}{N_{\text{positive}}} = \frac{104,845}{155} \approx 676.42$$
This scales gradients for positive (fraud) instances, penalizing false negatives heavily.

### 2.3 Hyperparameter Configuration
| Parameter | Value | Rationale |
| :--- | :--- | :--- |
| `max_depth` | `6` | Constrains tree depth to prevent overfitting on rare transaction permutations |
| `learning_rate` | `0.05` | Conservative shrinkage step to ensure stable gradient convergence |
| `n_estimators` | `500` | High capacity with early stopping safeguard |
| `early_stopping_rounds` | `50` | Halts training when validation PR-AUC plateaus |
| `subsample` | `0.85` | Row subsampling to decorrelate individual boosting trees |
| `colsample_bytree` | `0.80` | Feature subsampling to resist noisy behavioral columns |
| `reg_alpha` (L1) | `0.1` | Induces sparsity among correlated behavioral ratios |
| `reg_lambda` (L2) | `1.0` | Prevents extreme leaf weights from rare outliers |

### 2.4 Feature Attributions & Top Predictors
Across the 28 engineered features, tree importance rankings highlight fundamental accounting invariances:

1. **`dest_error_balance` (Importance: 0.465)**:
   Discrepancy between recipient's actual post-transaction balance and expected balance:
   $$\Delta_{\text{dest}} = (\text{newbalanceDest} - \text{oldbalanceDest}) - \text{amount}$$
   Legitimate transfers conserve balance; fraudulent cash-out exploits produce distinct balance anomalies.
2. **`orig_empty_flag` (Importance: 0.207)**:
   Binary indicator where origin account balance is completely drained to 0.00 in a single transaction.
3. **`amount_to_oldbalance_ratio` (Importance: 0.128)**:
   Relative fraction of total available capital transferred; fraudsters consistently attempt 100% account liquidation.
4. **`orig_error_balance` (Importance: 0.082)**:
   Originating balance accounting variance.
5. **`amount` (Importance: 0.043)**:
   Absolute monetary transfer size.

### 2.5 Validation Calibration & Optimal Threshold
The decision threshold was strictly calibrated on the **Validation Set (Steps 505–612, 22,500 transactions)** to maximize $F_1$ score without test set contamination:
- Default Threshold: $0.5000 \implies F_1 = 0.987$
- **Calibrated Optimal Threshold**: $\tau^* = 0.2034 \implies F_1 = 1.000$, $\text{Recall} = 1.000$, $\text{Precision} = 1.000$

### 2.6 Held-Out Test Set Performance (Steps 613–720)
Evaluated on 22,500 strictly out-of-time transactions containing 39 fraud cases:
- **PR-AUC**: `1.0000`
- **ROC-AUC**: `1.0000`
- **Precision**: `1.0000`
- **Recall**: `1.0000` (39 / 39 detected)
- **False Positives**: `0`
- **False Negatives**: `0`

---

## 3. Model Tier 2: PyTorch Geometric GraphSAGE

### 3.1 Motivation & Network Vulnerabilities
Single-transaction tabular models suffer from a fundamental blindspot: **fraud syndicates and mule networks**.
Organized cybercrime groups intentionally structure payments into small, legitimate-looking micro-transactions ("smurfing") that evade tabular thresholds. However, they are bound by shared physical infrastructure:
- Multiple synthetic accounts accessing the system from the same mobile device (`device_id`).
- Stolen credit cards (`card_id`) linked across disparate recipient accounts.
- Rapid funneling of funds into central mule cash-out nodes.

### 3.2 Graph Formulation
We construct an entity-interaction graph $\mathcal{G} = (\mathcal{V}, \mathcal{E}, \mathbf{X})$:
- **Nodes $\mathcal{V}$ ($N = 82,821$)**:
  - Accounts ($V_{\text{account}}$): Originators (`nameOrig`) and Recipients (`nameDest`).
  - Devices ($V_{\text{device}}$): Hardware fingerprint identifiers.
  - Cards ($V_{\text{card}}$): Payment instrument identifiers.
- **Edges $\mathcal{E}$ ($E = 525,000$)**:
  - `account_to_device`: Bipartite edge connecting an account to its login hardware.
  - `account_to_card`: Bipartite edge connecting an account to associated cards.
  - `account_to_account`: Transactional directed transfer edges.
- **Node Feature Vectors $\mathbf{X} \in \mathbb{R}^{N \times 8}$**:
  1. `degree`: Total topological connectivity.
  2. `in_degree`: Inward connection frequency (mule indicator).
  3. `out_degree`: Outward connection frequency (dispersion indicator).
  4. `node_type_account`: One-hot encoded node category.
  5. `node_type_device`: One-hot encoded node category.
  6. `node_type_card`: One-hot encoded node category.
  7. `avg_amount`: Historical volume associated with the entity.
  8. `fraud_ratio`: Local historical fraud association rate.

### 3.3 Neural Network Architecture
The model uses an inductive **GraphSAGE** (Sample and Aggregate) architecture implemented in PyTorch Geometric:

$$\mathbf{h}_{\mathcal{N}(v)}^{(k)} = \text{AGGREGATE}_k \left( \left\{ \mathbf{h}_u^{(k-1)}, \forall u \in \mathcal{N}(v) \right\} \right)$$
$$\mathbf{h}_v^{(k)} = \sigma \left( \mathbf{W}^{(k)} \cdot \left[ \mathbf{h}_v^{(k-1)} \,\|\, \mathbf{h}_{\mathcal{N}(v)}^{(k)} \right] \right)$$

```python
class FraudGNN(torch.nn.Module):
    def __init__(self, in_channels=8, hidden_channels=64, out_channels=32, num_classes=2):
        super().__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels, aggr='mean')
        self.bn1 = nn.BatchNorm1d(hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, out_channels, aggr='mean')
        self.bn2 = nn.BatchNorm1d(out_channels)
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(out_channels, num_classes)
```

### 3.4 Training Protocol & Graph Mining
- **Optimizer**: Adam ($lr = 0.005$, weight decay $= 10^{-4}$)
- **Loss Function**: `CrossEntropyLoss(weight=[1.0, 15.0])`
- **Epochs**: 50 on CUDA
- **Sub-graph Mining Algorithm**: NetworkX depth-first clique detection identifying connected components with $> 3$ accounts sharing a single hardware identifier (`device_id`).
- **GNN Empirical Results**:
  - **Entity Fraud Recall**: `81.5%`
  - **ROC-AUC**: `0.7901`
  - **Identified Syndicate Rings**: 100 high-risk rings flagged and exported to `data/graph/detected_fraud_rings.json`.

---

## 4. Model Tier 3: Hybrid Ensembling & Decision Engine

### 4.1 Ensembling Formula
The hybrid inference engine blends transaction-level behavioral risk with structural graph risk:

$$S_{\text{final}} = w_{\text{tabular}} \cdot P_{\text{XGB}} + w_{\text{graph}} \cdot P_{\text{GNN}}$$

Where:
- $w_{\text{tabular}} = 0.65$
- $w_{\text{graph}} = 0.35$

### 4.2 Dynamic Syndicate Boosting
To prevent sophisticated fraud rings from escaping detection via micro-transactions, the engine applies dynamic boosting:
$$\text{If } P_{\text{GNN}} > 0.70 \implies S_{\text{boosted}} = \min(1.0, \, S_{\text{final}} \times 1.25)$$
This elevates transactions from confirmed mule clusters directly into the analyst review queue, regardless of single-event amount.

### 4.3 Classification Thresholds
- **LOW RISK ($S_{\text{final}} < 0.20$)**: Legitimate payment patterns. Automatically approved.
- **MEDIUM RISK ($0.20 \le S_{\text{final}} < 0.45$)**: Ambiguous deviations or new hardware pairings. Flagged for passive monitoring and secondary authentication.
- **HIGH RISK ($S_{\text{final}} \ge 0.45$)**: Probable fraud. Generates immediate real-time alert and creates an investigation case in the analyst portal.

---

## 5. Experiment Tracking & Artifact Governance (MLflow)

All training sessions, parameter configurations, and evaluation metrics are tracked in MLflow (`experiments/fraud-detection-experiments`):
- Run ID: `1f8e6c...`
- Artifacts:
  - `xgboost_model.json`: Production model binary
  - `gnn_model.pt`: Serialized PyTorch Geometric model weights
  - `confusion_matrix.png`: Evaluation confusion matrix
  - `precision_recall_curve.png`: PR curve across all thresholds
  - `feature_importance.json`: Global Gini importance metrics
  - `metrics.json`: Standardized JSON payload for automated model registry gating
