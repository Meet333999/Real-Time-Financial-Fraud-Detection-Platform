"""
Feast Feature Definitions for Fraud Detection
==============================================
Defines:
- Entities: User (Account), Device, Card
- Feature Views: User Behavioral, Device Network, Card Association
- Feature Service: fraud_scoring_v1
"""

from datetime import timedelta
from feast import (
    Entity,
    Field,
    FeatureView,
    FileSource,
    FeatureService,
    ValueType
)
from feast.types import Float32, Float64, Int32, Int64, String

# 1. ENTITY DEFINITIONS
user_entity = Entity(
    name="user_id",
    value_type=ValueType.STRING,
    description="Customer account identifier (nameOrig / nameDest)"
)

device_entity = Entity(
    name="device_id",
    value_type=ValueType.STRING,
    description="Device identifier used in transaction"
)

card_entity = Entity(
    name="card_id",
    value_type=ValueType.STRING,
    description="Payment card identifier associated with account"
)

# 2. BATCH FILE SOURCES
user_source = FileSource(
    name="user_features_source",
    path="data/user_features.parquet",
    timestamp_field="timestamp"
)

device_source = FileSource(
    name="device_features_source",
    path="data/device_features.parquet",
    timestamp_field="timestamp"
)

card_source = FileSource(
    name="card_features_source",
    path="data/card_features.parquet",
    timestamp_field="timestamp"
)

# 3. FEATURE VIEWS
user_behavior_view = FeatureView(
    name="user_behavior_view",
    entities=[user_entity],
    ttl=timedelta(days=365),
    schema=[
        Field(name="user_historical_mean", dtype=Float64),
        Field(name="user_historical_std", dtype=Float64),
        Field(name="user_txn_velocity", dtype=Float64),
        Field(name="amount_to_user_avg_ratio", dtype=Float64),
        Field(name="amount_z_score", dtype=Float64),
    ],
    online=True,
    source=user_source,
    tags={"team": "fraud_analytics", "tier": "tier_1"}
)

device_behavior_view = FeatureView(
    name="device_behavior_view",
    entities=[device_entity],
    ttl=timedelta(days=365),
    schema=[
        Field(name="device_user_count", dtype=Float64),
        Field(name="is_shared_device", dtype=Int64),
    ],
    online=True,
    source=device_source,
    tags={"team": "fraud_analytics", "tier": "tier_1"}
)

card_behavior_view = FeatureView(
    name="card_behavior_view",
    entities=[card_entity],
    ttl=timedelta(days=365),
    schema=[
        Field(name="card_user_count", dtype=Float64),
        Field(name="is_shared_card", dtype=Int64),
    ],
    online=True,
    source=card_source,
    tags={"team": "fraud_analytics", "tier": "tier_1"}
)

# 4. FEATURE SERVICE
fraud_scoring_service = FeatureService(
    name="fraud_scoring_v1",
    features=[
        user_behavior_view,
        device_behavior_view,
        card_behavior_view
    ]
)
