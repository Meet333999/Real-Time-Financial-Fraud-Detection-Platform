"""
Data Preprocessing & Feature Pipeline Script
===========================================
Executes:
1. Loading raw dataset
2. Strict chronological train/validation/test split (no lookahead bias)
3. Fitting user/device behavioral profiles on train partition ONLY
4. Extracting feature sets (train_features, val_features, test_features)
5. Validating features and exporting Parquet artifacts
"""

import os
import sys
import json
import time
import pandas as pd
import numpy as np

# Ensure root directory is on path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.features.preprocessing import TransactionDataPreprocessor
from backend.features.feature_engineering import FeatureEngineer
from backend.features.feature_validation import FeatureValidator

DATA_RAW = os.path.join(ROOT_DIR, "data", "raw", "paysim.parquet")
DATA_PROCESSED_DIR = os.path.join(ROOT_DIR, "data", "processed")
DATA_REPORTS_DIR = os.path.join(ROOT_DIR, "data", "reports")
FEAST_DATA_DIR = os.path.join(ROOT_DIR, "backend", "feature_store", "feast_repo", "data")
os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
os.makedirs(DATA_REPORTS_DIR, exist_ok=True)
os.makedirs(FEAST_DATA_DIR, exist_ok=True)


def main():
    print("=" * 60)
    print("FEATURE PIPELINE: CHRONOLOGICAL SPLIT & TRANSFORMATION")
    print("=" * 60)
    t0 = time.time()

    preprocessor = TransactionDataPreprocessor(DATA_RAW)
    raw_df = preprocessor.load_data()
    clean_df = preprocessor.clean_and_normalize(raw_df)

    # 1. Chronological Split: 70% Train, 15% Val, 15% Test
    train_df, val_df, test_df, split_meta = preprocessor.chronological_split(
        clean_df, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, time_col="step"
    )

    # Save raw split partitions
    train_df.to_parquet(os.path.join(DATA_PROCESSED_DIR, "train.parquet"), index=False)
    val_df.to_parquet(os.path.join(DATA_PROCESSED_DIR, "val.parquet"), index=False)
    test_df.to_parquet(os.path.join(DATA_PROCESSED_DIR, "test.parquet"), index=False)

    # Save split metadata report
    split_report_path = os.path.join(DATA_REPORTS_DIR, "preprocessing_split_report.json")
    with open(split_report_path, "w") as f:
        json.dump(split_meta, f, indent=2, default=str)
    print(f"[+] Saved split report to: {split_report_path}")

    # 2. Fit Feature Engineering strictly on Training Set
    fe = FeatureEngineer()
    fe.fit_behavioral_profiles(train_df)

    # 3. Transform partitions
    print("[*] Transforming train feature matrix...")
    X_train, y_train = fe.transform(train_df)
    train_features = X_train.copy()
    train_features["isFraud"] = y_train
    train_features["transaction_id"] = train_df["transaction_id"].values
    train_features["timestamp"] = pd.to_datetime(train_df["timestamp"])
    train_features["nameOrig"] = train_df["nameOrig"].values
    train_features["device_id"] = train_df["device_id"].values
    train_features["card_id"] = train_df["card_id"].values

    print("[*] Transforming validation feature matrix...")
    X_val, y_val = fe.transform(val_df)
    val_features = X_val.copy()
    val_features["isFraud"] = y_val
    val_features["transaction_id"] = val_df["transaction_id"].values
    val_features["timestamp"] = pd.to_datetime(val_df["timestamp"])
    val_features["nameOrig"] = val_df["nameOrig"].values
    val_features["device_id"] = val_df["device_id"].values
    val_features["card_id"] = val_df["card_id"].values

    print("[*] Transforming test feature matrix...")
    X_test, y_test = fe.transform(test_df)
    test_features = X_test.copy()
    test_features["isFraud"] = y_test
    test_features["transaction_id"] = test_df["transaction_id"].values
    test_features["timestamp"] = pd.to_datetime(test_df["timestamp"])
    test_features["nameOrig"] = test_df["nameOrig"].values
    test_features["device_id"] = test_df["device_id"].values
    test_features["card_id"] = test_df["card_id"].values

    # 4. Feature Validation
    validator = FeatureValidator(fe.feature_names)
    validator.validate_features(X_train)
    validator.validate_features(X_val)
    validator.validate_features(X_test)

    # 5. Export processed features
    train_feat_path = os.path.join(DATA_PROCESSED_DIR, "train_features.parquet")
    val_feat_path = os.path.join(DATA_PROCESSED_DIR, "val_features.parquet")
    test_feat_path = os.path.join(DATA_PROCESSED_DIR, "test_features.parquet")

    train_features.to_parquet(train_feat_path, index=False)
    val_features.to_parquet(val_feat_path, index=False)
    test_features.to_parquet(test_feat_path, index=False)
    print(f"[+] Exported feature datasets to {DATA_PROCESSED_DIR}")

    # 6. Export Feast Feature Tables
    # Entity 1: User Behavioral Feature Table
    user_features_df = train_features[[
        "nameOrig", "timestamp", "user_historical_mean", "user_historical_std",
        "user_txn_velocity", "amount_to_user_avg_ratio", "amount_z_score"
    ]].copy()
    user_features_df.rename(columns={"nameOrig": "user_id"}, inplace=True)
    user_features_df.drop_duplicates(subset=["user_id"], keep="last", inplace=True)
    user_feast_path = os.path.join(FEAST_DATA_DIR, "user_features.parquet")
    user_features_df.to_parquet(user_feast_path, index=False)

    # Entity 2: Device Feature Table
    device_features_df = train_features[[
        "device_id", "timestamp", "device_user_count", "is_shared_device"
    ]].copy()
    device_features_df.drop_duplicates(subset=["device_id"], keep="last", inplace=True)
    device_feast_path = os.path.join(FEAST_DATA_DIR, "device_features.parquet")
    device_features_df.to_parquet(device_feast_path, index=False)

    # Entity 3: Card Feature Table
    card_features_df = train_features[[
        "card_id", "timestamp", "card_user_count", "is_shared_card"
    ]].copy()
    card_features_df.drop_duplicates(subset=["card_id"], keep="last", inplace=True)
    card_feast_path = os.path.join(FEAST_DATA_DIR, "card_features.parquet")
    card_features_df.to_parquet(card_feast_path, index=False)

    print(f"[+] Exported Feast entity tables to {FEAST_DATA_DIR}")
    print(f"[+] Feature pipeline completed in {time.time()-t0:.2f}s!")


if __name__ == "__main__":
    main()
