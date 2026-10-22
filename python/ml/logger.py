"""
Structured logging & monitoring for ML pipeline.
Tracks predictions, latency, drift, errors, and fairness metrics.
"""

import logging
import json
import time
from datetime import datetime
from collections import defaultdict, deque
from threading import Lock

# ── Structured logger ──
logger = logging.getLogger("underwriteai.ml")
logger.setLevel(logging.INFO)

if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-5s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    ))
    logger.addHandler(handler)


class MLMetrics:
    """In-memory metrics collector for ML pipeline monitoring."""

    def __init__(self, window_size=1000):
        self._lock = Lock()
        self._window = window_size
        self._predictions = deque(maxlen=window_size)
        self._latencies = deque(maxlen=window_size)
        self._errors = deque(maxlen=window_size)
        self._scores_by_type = defaultdict(lambda: deque(maxlen=window_size))
        self._total_predictions = 0
        self._total_errors = 0

    def record_prediction(self, policy_type: str, risk_score: float,
                          decision: str, latency_ms: float, features: dict = None):
        with self._lock:
            entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "policy_type": policy_type,
                "risk_score": risk_score,
                "decision": decision,
                "latency_ms": round(latency_ms, 2),
            }
            self._predictions.append(entry)
            self._latencies.append(latency_ms)
            self._scores_by_type[policy_type].append(risk_score)
            self._total_predictions += 1

            logger.info(json.dumps({
                "event": "prediction",
                "policy_type": policy_type,
                "risk_score": risk_score,
                "decision": decision,
                "latency_ms": round(latency_ms, 2),
            }))

    def record_error(self, policy_type: str, error: str):
        with self._lock:
            entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "policy_type": policy_type,
                "error": error,
            }
            self._errors.append(entry)
            self._total_errors += 1
            logger.error(json.dumps({"event": "prediction_error", **entry}))

    def get_metrics(self) -> dict:
        """Return current metrics snapshot."""
        with self._lock:
            latencies = list(self._latencies)
            scores = list(self._predictions)

            if not latencies:
                latency_stats = {"p50": 0, "p95": 0, "p99": 0, "mean": 0}
            else:
                import numpy as np
                arr = np.array(latencies)
                latency_stats = {
                    "p50": round(float(np.percentile(arr, 50)), 2),
                    "p95": round(float(np.percentile(arr, 95)), 2),
                    "p99": round(float(np.percentile(arr, 99)), 2),
                    "mean": round(float(np.mean(arr)), 2),
                }

            # Score distribution per type
            distributions = {}
            for pt, scores_deque in self._scores_by_type.items():
                s = list(scores_deque)
                if s:
                    import numpy as np
                    arr = np.array(s)
                    distributions[pt] = {
                        "count": len(s),
                        "mean": round(float(np.mean(arr)), 1),
                        "std": round(float(np.std(arr)), 1),
                        "min": round(float(np.min(arr)), 1),
                        "max": round(float(np.max(arr)), 1),
                    }

            # Decision distribution
            decision_counts = defaultdict(int)
            for p in scores:
                decision_counts[p["decision"]] += 1

            return {
                "total_predictions": self._total_predictions,
                "total_errors": self._total_errors,
                "error_rate": round(self._total_errors / max(1, self._total_predictions) * 100, 2),
                "latency": latency_stats,
                "score_distributions": dict(distributions),
                "decision_distribution": dict(decision_counts),
                "recent_errors": list(self._errors)[-5:],
            }

    def check_drift(self, policy_type: str, baseline_mean: float, baseline_std: float) -> dict | None:
        """Simple drift detection: check if current score distribution shifted."""
        with self._lock:
            scores = list(self._scores_by_type.get(policy_type, []))
            if len(scores) < 50:
                return None

            import numpy as np
            current_mean = float(np.mean(scores[-100:]))
            current_std = float(np.std(scores[-100:]))

            mean_shift = abs(current_mean - baseline_mean)
            std_ratio = current_std / max(baseline_std, 0.01)

            drifted = mean_shift > 2 * baseline_std or std_ratio > 2.0 or std_ratio < 0.5

            result = {
                "policy_type": policy_type,
                "baseline_mean": baseline_mean,
                "baseline_std": baseline_std,
                "current_mean": round(current_mean, 2),
                "current_std": round(current_std, 2),
                "mean_shift": round(mean_shift, 2),
                "drifted": drifted,
            }

            if drifted:
                logger.warning(json.dumps({"event": "drift_detected", **result}))

            return result


# Global metrics instance
metrics = MLMetrics()
