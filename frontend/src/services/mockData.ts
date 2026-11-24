/**
 * Standalone Offline / Demo Fallback Data
 * Ensures the platform dashboard is 100% interactive on static cloud deployments (e.g. Hugging Face Spaces).
 */

export const MOCK_OVERVIEW = {
  total_transactions: 150000,
  flagged_transactions: 342,
  high_risk_transactions: 234,
  medium_risk_transactions: 108,
  low_risk_transactions: 149658,
  confirmed_fraud_cases: 218,
  false_positives: 16,
  fraud_detection_rate: 99.4,
  avg_processing_latency_ms: 8.70,
  p95_processing_latency_ms: 9.59
};

export const MOCK_TRENDS = {
  recent_time_series: [
    { timestamp: '12:00', score: 0.12, amount: 150 },
    { timestamp: '12:05', score: 0.15, amount: 240 },
    { timestamp: '12:10', score: 0.94, amount: 95000 },
    { timestamp: '12:15', score: 0.18, amount: 320 },
    { timestamp: '12:20', score: 0.22, amount: 410 },
    { timestamp: '12:25', score: 0.89, amount: 84000 },
    { timestamp: '12:30', score: 0.14, amount: 290 },
    { timestamp: '12:35', score: 0.19, amount: 510 },
    { timestamp: '12:40', score: 0.97, amount: 185000 }
  ],
  risk_breakdown: [
    { name: 'Low Risk', value: 149658, color: '#10B981' },
    { name: 'Medium Risk', value: 108, color: '#F59E0B' },
    { name: 'High Risk', value: 234, color: '#EF4444' }
  ],
  type_breakdown: [
    { type: 'TRANSFER', count: 53200 },
    { type: 'PAYMENT', count: 42100 },
    { type: 'CASH_OUT', count: 34500 },
    { type: 'CASH_IN', count: 20200 }
  ]
};

export const MOCK_TRANSACTIONS = [
  {
    transaction_id: 'TXN_LIVE_90241',
    timestamp: new Date().toISOString(),
    type: 'TRANSFER',
    amount: 185000.0,
    nameOrig: 'C102938475',
    nameDest: 'C998877665',
    device_id: 'DEV_RING_S',
    card_id: 'CARD_9921_8812',
    xgboost_score: 0.985,
    graph_risk_score: 0.942,
    combined_risk_score: 0.970,
    risk_category: 'HIGH_RISK' as const,
    is_flagged: true,
    latency_ms: 8.74,
    contributing_features: [
      { feature: 'dest_error_balance', value: -185000.0, global_importance: 0.465, risk_contribution: 0.42 },
      { feature: 'orig_empty_flag', value: 1.0, global_importance: 0.207, risk_contribution: 0.28 },
      { feature: 'amount_to_oldbalance_ratio', value: 1.0, global_importance: 0.128, risk_contribution: 0.18 }
    ]
  },
  {
    transaction_id: 'TXN_LIVE_90240',
    timestamp: new Date(Date.now() - 3500).toISOString(),
    type: 'CASH_OUT',
    amount: 94200.0,
    nameOrig: 'C881920311',
    nameDest: 'M339918274',
    device_id: 'DEV_RING_S',
    card_id: 'CARD_4491_0029',
    xgboost_score: 0.961,
    graph_risk_score: 0.895,
    combined_risk_score: 0.938,
    risk_category: 'HIGH_RISK' as const,
    is_flagged: true,
    latency_ms: 8.91,
    contributing_features: [
      { feature: 'dest_error_balance', value: -94200.0, global_importance: 0.465, risk_contribution: 0.45 },
      { feature: 'orig_empty_flag', value: 1.0, global_importance: 0.207, risk_contribution: 0.30 }
    ]
  },
  {
    transaction_id: 'TXN_LIVE_90239',
    timestamp: new Date(Date.now() - 7200).toISOString(),
    type: 'PAYMENT',
    amount: 142.5,
    nameOrig: 'C449102931',
    nameDest: 'M991827364',
    device_id: 'DEV_USR_4812',
    card_id: 'CARD_1192_8841',
    xgboost_score: 0.012,
    graph_risk_score: 0.024,
    combined_risk_score: 0.016,
    risk_category: 'LOW_RISK' as const,
    is_flagged: false,
    latency_ms: 8.65
  },
  {
    transaction_id: 'TXN_LIVE_90238',
    timestamp: new Date(Date.now() - 11000).toISOString(),
    type: 'TRANSFER',
    amount: 14500.0,
    nameOrig: 'C771294821',
    nameDest: 'C10000014',
    device_id: 'DEV_RING_S',
    card_id: 'CARD_3391_8810',
    xgboost_score: 0.412,
    graph_risk_score: 0.890,
    combined_risk_score: 0.579,
    risk_category: 'HIGH_RISK' as const,
    is_flagged: true,
    latency_ms: 9.12,
    contributing_features: [
      { feature: 'graph_syndicate_boost', value: 1.25, global_importance: 0.35, risk_contribution: 0.40 },
      { feature: 'device_sharing_count', value: 10.0, global_importance: 0.15, risk_contribution: 0.25 }
    ]
  },
  {
    transaction_id: 'TXN_LIVE_90237',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    type: 'PAYMENT',
    amount: 68.2,
    nameOrig: 'C551928374',
    nameDest: 'M102938475',
    device_id: 'DEV_USR_9921',
    card_id: 'CARD_6612_4490',
    xgboost_score: 0.008,
    graph_risk_score: 0.015,
    combined_risk_score: 0.010,
    risk_category: 'LOW_RISK' as const,
    is_flagged: false,
    latency_ms: 8.52
  },
  {
    transaction_id: 'TXN_LIVE_90236',
    timestamp: new Date(Date.now() - 19000).toISOString(),
    type: 'CASH_OUT',
    amount: 1250.0,
    nameOrig: 'C991827364',
    nameDest: 'M448192031',
    device_id: 'DEV_USR_3311',
    card_id: 'CARD_7721_9901',
    xgboost_score: 0.245,
    graph_risk_score: 0.210,
    combined_risk_score: 0.233,
    risk_category: 'MEDIUM_RISK' as const,
    is_flagged: true,
    latency_ms: 8.80
  }
];

export const MOCK_ALERTS = [
  {
    alert_id: 'ALT_90241',
    transaction_id: 'TXN_LIVE_90241',
    account_id: 'C102938475',
    amount: 185000.0,
    combined_risk_score: 0.970,
    severity: 'HIGH',
    status: 'NEW',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    notes: 'Complete origin balance liquidation drain to 0.0 with shared syndicate device DEV_RING_S',
    contributing_features: [
      { feature: 'dest_error_balance', contribution: 0.465 },
      { feature: 'orig_empty_flag', contribution: 0.207 }
    ]
  },
  {
    alert_id: 'ALT_90240',
    transaction_id: 'TXN_LIVE_90240',
    account_id: 'C881920311',
    amount: 94200.0,
    combined_risk_score: 0.938,
    severity: 'HIGH',
    status: 'UNDER_REVIEW',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    notes: 'Rapid cash-out following off-hours device association on DEV_RING_S',
    contributing_features: [
      { feature: 'dest_error_balance', contribution: 0.465 }
    ]
  },
  {
    alert_id: 'ALT_90238',
    transaction_id: 'TXN_LIVE_90238',
    account_id: 'C771294821',
    amount: 14500.0,
    combined_risk_score: 0.579,
    severity: 'HIGH',
    status: 'NEW',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    notes: 'Recipient account C10000014 identified as central consolidation mule hub in Ring RING_DEV_001'
  },
  {
    alert_id: 'ALT_90236',
    transaction_id: 'TXN_LIVE_90236',
    account_id: 'C991827364',
    amount: 1250.0,
    combined_risk_score: 0.233,
    severity: 'MEDIUM',
    status: 'RESOLVED',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    notes: 'Secondary authentication challenge verified by user SMS OTP.'
  }
];

export const MOCK_CASES = [
  {
    case_id: 'CASE_2026_001',
    transaction_id: 'TXN_LIVE_90241',
    account_id: 'C102938475',
    risk_score: 0.970,
    status: 'OPEN' as const,
    notes: 'Coordinated extraction across accounts tied to hardware fingerprint DEV_RING_S. Transferred $185,000 without balance credit.',
    evidence: { syndicate_id: 'RING_DEV_001', device_id: 'DEV_RING_S', connected_accounts: 10 },
    assigned_analyst: 'Sarah Jenkins (Lead Risk)',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString()
  },
  {
    case_id: 'CASE_2026_002',
    transaction_id: 'TXN_LIVE_90240',
    account_id: 'C881920311',
    risk_score: 0.938,
    status: 'UNDER_REVIEW' as const,
    notes: 'Mule account cash-out ring. Intercepted payment hold pending KYC re-verification.',
    evidence: { syndicate_id: 'RING_DEV_001', mule_tier: 'Secondary Cashier' },
    assigned_analyst: 'Marcus Vance',
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    case_id: 'CASE_2026_003',
    transaction_id: 'TXN_712_C440192',
    account_id: 'C440192019',
    risk_score: 0.982,
    status: 'CONFIRMED_FRAUD' as const,
    notes: 'Account takeover confirmed. Origin balance liquidated at 03:00 AM. Funds recovered via network freeze.',
    evidence: { ip_anomaly: true, device_change: true },
    assigned_analyst: 'Elena Rostova',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString()
  }
];

export const MOCK_RINGS = [
  {
    ring_id: 'RING_DEV_001',
    ring_name: 'Shared Device Syndicate (DEV_RING_S)',
    pattern_type: 'SHARED_DEVICE',
    risk_score: 0.99,
    severity: 'HIGH',
    member_count: 11,
    accounts_count: 10,
    primary_hub: 'DEV_RING_S',
    hub_type: 'device',
    total_transaction_volume: 217750.48,
    confirmed_fraud_count: 4,
    subgraph: {
      nodes: [
        { id: 'DEV_RING_S', type: 'device', is_hub: true },
        { id: 'C10000011', type: 'account', is_fraud: false },
        { id: 'C10000004', type: 'account', is_fraud: false },
        { id: 'C10000003', type: 'account', is_fraud: true },
        { id: 'C10000014', type: 'account', is_fraud: true },
        { id: 'C10000012', type: 'account', is_fraud: false },
        { id: 'C10000010', type: 'account', is_fraud: false },
        { id: 'C10000001', type: 'account', is_fraud: false },
        { id: 'C10000008', type: 'account', is_fraud: false },
        { id: 'C10000002', type: 'account', is_fraud: true },
        { id: 'C10000005', type: 'account', is_fraud: true }
      ],
      edges: [
        { source: 'C10000011', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000004', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000003', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000014', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000012', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000010', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000001', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000008', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000002', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000005', target: 'DEV_RING_S', type: 'account_device' },
        { source: 'C10000003', target: 'C10000014', type: 'transfer' },
        { source: 'C10000005', target: 'C10000014', type: 'transfer' },
        { source: 'C10000002', target: 'C10000014', type: 'transfer' }
      ]
    }
  },
  {
    ring_id: 'RING_CARD_002',
    ring_name: 'Card Recycling Cluster (CARD_9921_8812)',
    pattern_type: 'RECYCLED_CARD',
    risk_score: 0.94,
    severity: 'HIGH',
    member_count: 6,
    accounts_count: 5,
    primary_hub: 'CARD_9921_8812',
    hub_type: 'card',
    total_transaction_volume: 84300.0,
    confirmed_fraud_count: 2,
    subgraph: {
      nodes: [
        { id: 'CARD_9921_8812', type: 'card', is_hub: true },
        { id: 'C991827461', type: 'account', is_fraud: true },
        { id: 'C118294711', type: 'account', is_fraud: true },
        { id: 'C440192837', type: 'account', is_fraud: false },
        { id: 'C551928374', type: 'account', is_fraud: false },
        { id: 'C661294821', type: 'account', is_fraud: false }
      ],
      edges: [
        { source: 'C991827461', target: 'CARD_9921_8812', type: 'account_card' },
        { source: 'C118294711', target: 'CARD_9921_8812', type: 'account_card' },
        { source: 'C440192837', target: 'CARD_9921_8812', type: 'account_card' },
        { source: 'C551928374', target: 'CARD_9921_8812', type: 'account_card' },
        { source: 'C661294821', target: 'CARD_9921_8812', type: 'account_card' }
      ]
    }
  }
];

export const MOCK_MODEL_METRICS = {
  xgboost: {
    pr_auc: 1.000,
    roc_auc: 1.000,
    precision: 1.000,
    recall: 1.000,
    f1_score: 1.000,
    optimal_threshold: 0.2034,
    scale_pos_weight: 676.42,
    top_features: [
      { name: 'dest_error_balance', importance: 0.465 },
      { name: 'orig_empty_flag', importance: 0.207 },
      { name: 'amount_to_oldbalance_ratio', importance: 0.128 },
      { name: 'orig_error_balance', importance: 0.082 },
      { name: 'amount', importance: 0.043 }
    ]
  },
  gnn: {
    model_name: 'PyTorch Geometric GraphSAGE (2-layer SAGEConv)',
    recall: 0.815,
    roc_auc: 0.7901,
    nodes_count: 82821,
    edges_count: 525000,
    syndicates_detected: 100
  },
  hybrid: {
    formula: '0.65 * XGBoost + 0.35 * GraphSAGE (with 1.25x syndicate boost)',
    median_latency_ms: 8.70,
    p95_latency_ms: 9.59,
    throughput_tps: 113.28
  }
};

export const MOCK_DRIFT_STATUS = {
  drift_detected: false,
  number_of_features: 28,
  number_of_drifted_features: 1,
  drift_share: 0.0357,
  timestamp: new Date().toISOString(),
  drifted_features: [
    { feature: 'trans_hour', p_value: 0.041, stat_test: 'Kolmogorov-Smirnov' }
  ],
  retraining_status: {
    in_cooldown: false,
    last_retrained: '2026-11-24T23:35:00Z',
    active_champion: 'v1_production'
  }
};

export const MOCK_STREAMING_STATUS = {
  active_engine: 'In-Process Concurrent Event Bus (Local / HF Demo Mode)',
  throughput_tps: 113.28,
  median_latency_ms: 8.70,
  p95_latency_ms: 9.59,
  p99_latency_ms: 10.71,
  error_rate_pct: 0.0,
  buffer_depth: 0,
  kafka_connected: false
};
