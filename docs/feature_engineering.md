# Feature Engineering & Feast Feature Store Specification

## 1. Feature Engineering Overview

The platform extracts **28 engineered transaction, behavioral, and network features** designed to expose accounting irregularities, sudden velocity surges, and device sharing syndicates.

### Feature Categories

1. **Transaction & Time Features**:
   - `amount`: Raw monetary value.
   - `log_amount`: Natural log transformation $\ln(1 + \text{amount})$ to compress long-tailed monetary values.
   - `hour`: Transaction hour of day ($0 \dots 23$).
   - `day_of_week`: Day index ($0 \dots 6$).
   - `is_weekend`: Binary weekend indicator.
   - `type_CASH_IN`, `type_CASH_OUT`, `type_DEBIT`, `type_PAYMENT`, `type_TRANSFER`: One-hot encoded transaction typologies.

2. **Balance Integrity & Accounting Invariance**:
   - `orig_balance_change = oldbalanceOrg - newbalanceOrig`: Actual funds deducted from sender.
   - `dest_balance_change = newbalanceDest - oldbalanceDest`: Actual funds credited to recipient.
   - `orig_error_balance = (oldbalanceOrg - amount) - newbalanceOrig`: Discrepancy between stated balance arithmetic and transaction magnitude.
   - `dest_error_balance = (oldbalanceDest + amount) - newbalanceDest`: Accounting discrepancy on the recipient side.
   - `orig_empty_flag = (newbalanceOrig == 0.0) & (amount > 0.0)`: Binary flag indicating whether the origin account was completely drained.

3. **User Behavioral Profiles**:
   - `user_historical_mean`: Sender's baseline average transaction value fitted on historical data.
   - `user_historical_std`: Sender's baseline standard deviation.
   - `amount_to_user_avg_ratio`: Multiplier of current amount relative to sender historical mean.
   - `amount_z_score`: Standardized deviation $Z = \frac{\text{amount} - \mu}{\sigma}$.
   - `user_txn_velocity`: Total transaction count executed by user.

4. **Device & Card Syndicate Features**:
   - `device_user_count`: Number of distinct customer accounts associated with this device.
   - `card_user_count`: Number of distinct accounts sharing this payment card.
   - `is_shared_device`: Flag indicating device sharing ($\ge 2$ accounts).
   - `is_shared_card`: Flag indicating card recycling ($\ge 2$ accounts).

---

## 2. Feast Feature Store Architecture

Feast eliminates training-serving skew by storing historical features offline and serving point-in-time consistent values online.

### Entities
- `user_id`: Customer origin account (`nameOrig`).
- `device_id`: Device identifier.
- `card_id`: Payment card identifier.

### Feature Views
- `user_behavior_view`:
  - `user_historical_mean` (Float64)
  - `user_historical_std` (Float64)
  - `user_txn_velocity` (Float64)
  - `amount_to_user_avg_ratio` (Float64)
  - `amount_z_score` (Float64)
- `device_behavior_view`:
  - `device_user_count` (Float64)
  - `is_shared_device` (Int64)
- `card_behavior_view`:
  - `card_user_count` (Float64)
  - `is_shared_card` (Int64)

### Materialization Workflow
```bash
# Register feature views in Feast registry
cd backend/feature_store/feast_repo
feast apply

# Materialize offline Parquet tables into online SQLite store
feast materialize 2024-01-01T00:00:00 2028-01-01T00:00:00
```
Online feature retrieval latency: **< 1.0 ms**.
