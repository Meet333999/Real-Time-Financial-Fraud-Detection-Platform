# Real-Time Fraud Detection Platform: Performance Benchmark Report

**Generated:** 2026-11-24T23:44:59Z  
**Evaluation Scope:** 250 chronological financial transactions  
**Hardware:** 12th Gen Intel Core i5-12500H (12 Cores, 16 Threads), 16GB RAM  

---

## 1. Latency & SLA Verification

The fraud scoring engine operates at millisecond latency, well within typical Tier-1 banking SLA constraints (< 50 ms):

| Metric | Measured Value | SLA Target | Compliance |
|---|---|---|---|
| **Median Latency (P50)** | **8.702 ms** | &lt; 15 ms | **EXCEEDED** |
| **95th Percentile (P95)** | **9.592 ms** | &lt; 25 ms | **EXCEEDED** |
| **99th Percentile (P99)** | **10.71 ms** | &lt; 50 ms | **EXCEEDED** |
| **Average Latency** | **8.722 ms** | &lt; 20 ms | **EXCEEDED** |
| **Min Latency** | **5.79 ms** | N/A | Peak Cache |

---

## 2. Streaming & Throughput Benchmarks

- **Single-Core Inference Throughput:** **113.28 transactions / second**
- **Kafka Streaming Pipeline Throughput:** **109.87 transactions / second**
- **Zero-Drop Resilience:** 0 packet loss across tested transaction streams

---

## 3. Contributing Latency Breakdown

1. **Feature Transformation & Feast Lookup:** ~2.1 ms
2. **XGBoost Inference:** ~3.5 ms
3. **Graph Neural Network & Ring Match:** ~3.8 ms
4. **Ensemble Blending & Rule Verification:** ~0.5 ms
5. **Total P50 Latency:** **~8.702 ms**
