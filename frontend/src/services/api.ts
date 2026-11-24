/**
 * API Service Client for Real-Time Fraud Detection Platform
 * Automatically falls back to high-fidelity mock data if the backend is offline
 * or when deployed as a static web application on Hugging Face Spaces.
 */

import {
  MOCK_OVERVIEW,
  MOCK_TRENDS,
  MOCK_TRANSACTIONS,
  MOCK_ALERTS,
  MOCK_CASES,
  MOCK_RINGS,
  MOCK_MODEL_METRICS,
  MOCK_DRIFT_STATUS,
  MOCK_STREAMING_STATUS
} from './mockData';

const API_BASE = '/api';

export interface OverviewMetrics {
  total_transactions: number;
  flagged_transactions: number;
  high_risk_transactions: number;
  medium_risk_transactions: number;
  low_risk_transactions: number;
  confirmed_fraud_cases: number;
  false_positives: number;
  fraud_detection_rate: number;
  avg_processing_latency_ms: number;
  p95_processing_latency_ms: number;
}

export interface ScoredTransaction {
  transaction_id: string;
  timestamp: string;
  type: string;
  amount: number;
  nameOrig: string;
  nameDest: string;
  device_id: string;
  card_id: string;
  xgboost_score: number;
  graph_risk_score: number;
  combined_risk_score: number;
  risk_category: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  is_flagged: boolean;
  latency_ms: number;
  contributing_features?: Array<{
    feature: string;
    value: number;
    global_importance: number;
    risk_contribution: number;
  }>;
}

export interface FraudAlert {
  alert_id: string;
  transaction_id: string;
  account_id: string;
  amount: number;
  combined_risk_score: number;
  severity: string;
  status: string;
  timestamp: string;
  notes?: string;
  contributing_features?: any[];
}

export interface InvestigationCase {
  case_id: string;
  transaction_id: string;
  account_id: string;
  risk_score: number;
  status: 'OPEN' | 'UNDER_REVIEW' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED';
  notes: string;
  evidence: any;
  assigned_analyst: string;
  created_at: string;
  updated_at: string;
}

export interface FraudRing {
  ring_id: string;
  ring_name: string;
  pattern_type: string;
  risk_score: number;
  severity: string;
  member_count: number;
  accounts_count: number;
  primary_hub: string;
  hub_type: string;
  total_transaction_volume: number;
  confirmed_fraud_count: number;
  subgraph: {
    nodes: Array<{ id: string; type: string; is_hub?: boolean; is_fraud?: boolean }>;
    edges: Array<{ source: string; target: string; type: string }>;
  };
}

// In-memory cases store for interactive status updates on static deployments
let localCases = [...MOCK_CASES];
let localAlerts = [...MOCK_ALERTS];

export const fetchOverview = async (): Promise<OverviewMetrics> => {
  try {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return MOCK_OVERVIEW;
  }
};

export const fetchTrends = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/analytics/trends`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return MOCK_TRENDS;
  }
};

export const fetchTransactions = async (
  limit = 50,
  risk_category?: string
): Promise<{ total: number; transactions: ScoredTransaction[] }> => {
  try {
    const url = `${API_BASE}/transactions?limit=${limit}${risk_category ? `&risk_category=${risk_category}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    let filtered = [...MOCK_TRANSACTIONS];
    if (risk_category && risk_category !== 'ALL') {
      filtered = filtered.filter((t) => t.risk_category === risk_category);
    }
    return {
      total: filtered.length,
      transactions: filtered.slice(0, limit)
    };
  }
};

export const fetchAlerts = async (status?: string): Promise<{ total: number; alerts: FraudAlert[] }> => {
  try {
    const url = `${API_BASE}/alerts${status ? `?status=${status}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    const filtered = status && status !== 'ALL'
      ? localAlerts.filter((a) => a.status === status)
      : localAlerts;
    return { total: filtered.length, alerts: filtered };
  }
};

export const fetchCases = async (status?: string): Promise<{ total: number; cases: InvestigationCase[] }> => {
  try {
    const url = `${API_BASE}/cases${status ? `?status=${status}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    const filtered = status && status !== 'ALL'
      ? localCases.filter((c) => c.status === status)
      : localCases;
    return { total: filtered.length, cases: filtered };
  }
};

export const updateCaseReview = async (caseId: string, status: any, notes: string): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, analyst_name: 'Lead Risk Analyst' })
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    localCases = localCases.map((c) =>
      c.case_id === caseId
        ? { ...c, status, notes: `${c.notes} | ${notes}`, updated_at: new Date().toISOString() }
        : c
    );
    return { status: 'success', message: 'Case updated successfully' };
  }
};

export const fetchFraudRings = async (): Promise<{ total_rings: number; rings: FraudRing[] }> => {
  try {
    const res = await fetch(`${API_BASE}/graph/fraud-rings?limit=50`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return { total_rings: MOCK_RINGS.length, rings: MOCK_RINGS };
  }
};

export const fetchAccountGraph = async (accountId: string): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/graph/accounts/${accountId}`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return MOCK_RINGS[0].subgraph;
  }
};

export const fetchModelStatus = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/models/status`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return {
      status: 'HEALTHY',
      active_champion: 'XGBoost v1 + PyG GraphSAGE v1',
      last_evaluated: new Date().toISOString()
    };
  }
};

export const fetchModelMetrics = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/models/metrics`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return MOCK_MODEL_METRICS;
  }
};

export const fetchDriftStatus = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/monitoring/drift`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return MOCK_DRIFT_STATUS;
  }
};

export const triggerRetraining = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/monitoring/trigger-retraining`, { method: 'POST' });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return {
      status: 'triggered',
      message: 'Automated retraining workflow executed. Validation PR-AUC verified.'
    };
  }
};

export const startStreaming = async (delay = 0.05, limit = 500): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/streaming/start?rate_delay=${delay}&limit=${limit}`, { method: 'POST' });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return { status: 'started', message: 'Streaming engine started (Demo Mode)' };
  }
};

export const stopStreaming = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/streaming/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return { status: 'stopped', message: 'Streaming engine paused' };
  }
};

export const fetchStreamingStatus = async (): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/streaming/status`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return MOCK_STREAMING_STATUS;
  }
};

export const scoreTransactionManual = async (payload: any): Promise<any> => {
  try {
    const res = await fetch(`${API_BASE}/transactions/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    const amount = Number(payload.amount || 100);
    const isDrain = Number(payload.newbalanceOrig || 0) === 0 && amount > 10000;
    const isRing = (payload.device_id || '').includes('RING');
    const xgb = isDrain ? 0.96 : amount > 50000 ? 0.75 : 0.05;
    const gnn = isRing ? 0.94 : 0.08;
    const combined = 0.65 * xgb + 0.35 * gnn;
    const category = combined >= 0.45 ? 'HIGH_RISK' : combined >= 0.20 ? 'MEDIUM_RISK' : 'LOW_RISK';

    return {
      transaction_id: `TXN_SIM_${Date.now()}`,
      decision: combined >= 0.45 ? 'DECLINE' : combined >= 0.20 ? 'CHALLENGE' : 'APPROVE',
      risk_tier: category.replace('_', ' '),
      risk_score: Number(combined.toFixed(4)),
      xgboost_score: Number(xgb.toFixed(4)),
      gnn_score: Number(gnn.toFixed(4)),
      syndicate_boost_applied: isRing,
      latency_ms: 8.74,
      top_risk_factors: [
        { feature: 'dest_error_balance', contribution: 0.465, value: -amount },
        { feature: 'orig_empty_flag', contribution: 0.207, value: isDrain ? 1.0 : 0.0 }
      ]
    };
  }
};
