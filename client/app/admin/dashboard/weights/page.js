"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ErrorState from "@/components/ui/ErrorState";
import AskAI from "@/components/ui/AskAI";
import { FadeUp } from "@/components/motion/StaggerReveal";
import { getClientPythonUrl } from "@/lib/api-config";

const PY = getClientPythonUrl();
const COLORS = {
  health: "#3B82F6", // Electric Cobalt
  auto: "#06B6D4",   // Cyan
  life: "#8B5CF6",   // Technical Violet
  property: "#38BDF8" // Sky Blue
};
const POLICY_LABELS = { health: "Health", auto: "Auto", life: "Life", property: "Property" };

/* ═══════ Animated Neural Network (Ordivalabs Precision Blueprint) ═══════ */
function NeuralNetwork({ categories, weights, accent }) {
  const sorted = useMemo(
    () => [...categories].sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0)),
    [categories, weights]
  );
  const n = sorted.length;
  const hidden = 5;
  const W = 900, H = Math.max(520, n * 48 + 80);
  const cx = [180, 450, 720];
  const mx = Math.max(...Object.values(weights), 1);
  const iY = (i) => 45 + i * ((H - 90) / (n - 1 || 1));
  const hY = (i) => 80 + i * ((H - 160) / (hidden - 1 || 1));
  const oY = H / 2;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const hiddenLabels = [
    "Gradient\nBoosting",
    "Random\nForest",
    "Ridge\nRegressor",
    "Cross\nValidation",
    "Stacking\nLayer",
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      <defs>
        <filter id={`g-${uid}`}>
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`sg-${uid}`}>
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`ng-${uid}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id={`og-${uid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.03" />
        </radialGradient>
      </defs>

      {/* Blueprint Grid Lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line
          key={`grid-${i}`}
          x1={0}
          y1={i * (H / 7)}
          x2={W}
          y2={i * (H / 7)}
          stroke="rgba(59,130,246,0.06)"
          strokeWidth={0.5}
          strokeDasharray="4 8"
        />
      ))}

      {/* Input → Hidden Connections + Particles */}
      {sorted.map((cat, i) => {
        const w = weights[cat.key] || 0;
        const op = Math.max(0.04, (w / mx) * 0.6);
        const sw = Math.max(0.5, (w / mx) * 3.5);
        return Array.from({ length: hidden }).map((_, j) => {
          const x1 = cx[0] + 26, y1 = iY(i), x2 = cx[1] - 28, y2 = hY(j);
          const dur = 1.8 + Math.random() * 2.5;
          const del = (i * hidden + j) * 0.06;
          const pid = `p1-${uid}-${i}-${j}`;
          return (
            <g key={`c1-${i}-${j}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={accent}
                strokeWidth={sw}
                opacity={op}
                style={{ transition: "all 0.6s" }}
              />
              {w > 2 && (
                <>
                  <path id={pid} d={`M${x1},${y1} L${x2},${y2}`} fill="none" stroke="none" />
                  <circle r={Math.max(1.5, sw * 0.8)} fill={accent} opacity={0.9} filter={`url(#sg-${uid})`}>
                    <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${del}s`}>
                      <mpath href={`#${pid}`} />
                    </animateMotion>
                  </circle>
                </>
              )}
            </g>
          );
        });
      })}

      {/* Hidden → Output Connections + Particles */}
      {Array.from({ length: hidden }).map((_, j) => {
        const x1 = cx[1] + 28, y1 = hY(j), x2 = cx[2] - 44, y2 = oY;
        const pid = `p2-${uid}-${j}`;
        return (
          <g key={`c2-${j}`}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={accent}
              strokeWidth={1.8}
              opacity={0.3}
              style={{ transition: "all 0.6s" }}
            />
            <path id={pid} d={`M${x1},${y1} L${x2},${y2}`} fill="none" stroke="none" />
            <circle r={2} fill={accent} opacity={0.8} filter={`url(#sg-${uid})`}>
              <animateMotion dur={`${2 + j * 0.4}s`} repeatCount="indefinite" begin={`${j * 0.3}s`}>
                <mpath href={`#${pid}`} />
              </animateMotion>
            </circle>
          </g>
        );
      })}

      {/* Input Nodes */}
      {sorted.map((cat, i) => {
        const w = weights[cat.key] || 0;
        const r = 10 + (w / mx) * 14;
        const on = w > 0;
        return (
          <g key={`in-${cat.key}`}>
            {/* Pulse Ring for high-weight features */}
            {w > 8 && (
              <circle cx={cx[0]} cy={iY(i)} r={r + 6} fill="none" stroke={accent} strokeWidth={1} opacity={0.25}>
                <animate attributeName="r" values={`${r + 3};${r + 12};${r + 3}`} dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.25;0.04;0.25" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={cx[0]}
              cy={iY(i)}
              r={r}
              fill={on ? `url(#ng-${uid})` : "#0F172A"}
              stroke={accent}
              strokeWidth={on ? 2 : 0.5}
              strokeOpacity={on ? 0.8 : 0.15}
              filter={w > 8 ? `url(#g-${uid})` : undefined}
              style={{ transition: "all 0.5s" }}
            />
            {/* Label Card */}
            <rect
              x={2}
              y={iY(i) - 10}
              width={cx[0] - r - 18}
              height={20}
              rx={4}
              fill="#070A13"
              stroke="rgba(59,130,246,0.15)"
              strokeWidth={0.5}
            />
            <text
              x={cx[0] - r - 14}
              y={iY(i) + 4}
              textAnchor="end"
              fill={on ? "#F8FAFC" : "#64748B"}
              fontSize="12"
              fontWeight="600"
              fontFamily="monospace"
            >
              {cat.label}
            </text>
            {/* Weight Value */}
            <text
              x={cx[0]}
              y={iY(i) + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={r > 16 ? "12" : "10"}
              fontWeight="800"
              fontFamily="monospace"
            >
              {w}
            </text>
          </g>
        );
      })}

      {/* Hidden Layer Nodes */}
      {hiddenLabels.map((label, j) => {
        const lines = label.split("\n");
        return (
          <g key={`h-${j}`}>
            <circle
              cx={cx[1]}
              cy={hY(j)}
              r={26}
              fill="#070A13"
              stroke={accent}
              strokeWidth={1.2}
              strokeOpacity={0.3}
            />
            {/* Rotating dashed ring */}
            <circle
              cx={cx[1]}
              cy={hY(j)}
              r={18}
              fill="none"
              stroke={accent}
              strokeWidth={0.8}
              strokeOpacity={0.2}
              strokeDasharray="4 6"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`0 ${cx[1]} ${hY(j)};360 ${cx[1]} ${hY(j)}`}
                dur={`${6 + j * 1.5}s`}
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={cx[1]}
              y={hY(j) - 2}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="9"
              fontWeight="700"
              fontFamily="monospace"
            >
              {lines[0]}
            </text>
            {lines[1] && (
              <text
                x={cx[1]}
                y={hY(j) + 10}
                textAnchor="middle"
                fill="#64748B"
                fontSize="8"
                fontWeight="500"
                fontFamily="monospace"
              >
                {lines[1]}
              </text>
            )}
          </g>
        );
      })}

      {/* Output Node */}
      <circle
        cx={cx[2]}
        cy={oY}
        r={44}
        fill={`url(#og-${uid})`}
        stroke={accent}
        strokeWidth={2}
        strokeOpacity={0.8}
        filter={`url(#g-${uid})`}
      />
      <circle cx={cx[2]} cy={oY} r={44} fill="none" stroke={accent} strokeWidth={1.5}>
        <animate attributeName="r" values="44;54;44" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.04;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx[2]} cy={oY} r={44} fill="none" stroke={accent} strokeWidth={0.8}>
        <animate attributeName="r" values="48;60;48" dur="5s" repeatCount="indefinite" begin="1s" />
        <animate attributeName="opacity" values="0.15;0.02;0.15" dur="5s" repeatCount="indefinite" begin="1s" />
      </circle>
      <text
        x={cx[2]}
        y={oY - 6}
        textAnchor="middle"
        fill={accent}
        fontSize="16"
        fontWeight="900"
        fontFamily="monospace"
      >
        RISK
      </text>
      <text
        x={cx[2]}
        y={oY + 12}
        textAnchor="middle"
        fill={accent}
        fontSize="16"
        fontWeight="900"
        fontFamily="monospace"
      >
        SCORE
      </text>
      <text
        x={cx[2]}
        y={oY + 28}
        textAnchor="middle"
        fill="#64748B"
        fontSize="10"
        fontFamily="monospace"
      >
        0 — 100
      </text>

      {/* Layer Coordinates */}
      <text
        x={cx[0]}
        y={H - 12}
        textAnchor="middle"
        fill="#64748B"
        fontSize="11"
        fontWeight="600"
        fontFamily="monospace"
      >
        [INPUT.FEATURES_WEIGHTED]
      </text>
      <text
        x={cx[1]}
        y={H - 12}
        textAnchor="middle"
        fill="#64748B"
        fontSize="11"
        fontWeight="600"
        fontFamily="monospace"
      >
        [STACKED.ENSEMBLE_CORE]
      </text>
      <text
        x={cx[2]}
        y={H - 12}
        textAnchor="middle"
        fill="#64748B"
        fontSize="11"
        fontWeight="600"
        fontFamily="monospace"
      >
        [ACTUARIAL.INDEX_OUTPUT]
      </text>
    </svg>
  );
}

/* ═══════ Save Success Overlay (Blueprint Modal) ═══════ */
function SaveOverlay({ weights, categories, accent, onClose }) {
  const sorted = [...categories].sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0));
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg blueprint-card p-6 bg-[#070A13] border-blue-500/30 shadow-2xl relative"
      >
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">[CALIBRATION_COMMITTED]</span>
            <h2 className="text-base font-bold text-white">Weights Successfully Persisted</h2>
            <p className="text-xs text-slate-400 font-mono">Real-time risk scoring engine updated with new parameters</p>
          </div>
        </div>

        {/* Stacked bar */}
        <div className="mb-5">
          <div className="flex h-5 rounded overflow-hidden mb-3 bg-slate-900 border border-slate-800">
            {sorted
              .filter((c) => (weights[c.key] || 0) > 0)
              .map((cat) => {
                const w = weights[cat.key] || 0;
                return (
                  <div
                    key={cat.key}
                    title={`${cat.label}: ${w}pts`}
                    style={{
                      width: `${w}%`,
                      height: "100%",
                      background: accent,
                      opacity: 0.3 + (w / total) * 1.5,
                      borderRight: "1px solid rgba(0,0,0,0.5)",
                    }}
                    className="flex items-center justify-center"
                  >
                    {w >= 8 && (
                      <span className="text-[9px] font-bold text-white font-mono">{w}</span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {sorted.map((cat) => {
              const w = weights[cat.key] || 0;
              return (
                <div
                  key={cat.key}
                  className="flex items-center justify-between p-2 rounded bg-[#0A0F1D] border border-slate-800/80 text-xs font-mono"
                >
                  <span className={w > 0 ? "text-slate-300" : "text-slate-600"}>{cat.label}</span>
                  <span className="font-bold" style={{ color: w > 0 ? accent : "#475569" }}>
                    {w}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all"
          >
            Acknowledge [OK]
          </button>
          <AskAI
            question={`Analyze my custom weight configuration for this policy. I've set: ${sorted
              .map((c) => `${c.label}: ${weights[c.key] || 0}`)
              .join(", ")}. Total: ${total}. Is this a balanced configuration?`}
            label="Audit with AI"
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════ Individual Weight Control Card ═══════ */
function WeightCard({ cat, value, accent, maxWeight, onChange }) {
  const pct = maxWeight > 0 ? (value / maxWeight) * 100 : 0;
  return (
    <div
      className="relative rounded-lg p-3 transition-all duration-200 border bg-[#0A0F1D]/80"
      style={{
        borderColor: value > 0 ? `${accent}30` : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `${accent}0A`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate text-slate-200 font-sans">
            {cat.label}
          </div>
          {cat.default !== value && (
            <div className="text-[10px] font-mono text-slate-500">
              baseline: {cat.default}%
            </div>
          )}
        </div>

        {/* Stepper controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(cat.key, Math.max(0, value - 1))}
            className="w-6 h-6 rounded bg-[#070A13] border border-slate-700 hover:border-blue-500 text-slate-400 hover:text-white flex items-center justify-center font-mono text-xs font-bold transition-colors"
          >
            -
          </button>
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(cat.key, Number(e.target.value) || 0)}
            className="w-12 h-6 text-center font-mono font-bold text-xs bg-[#070A13] border rounded outline-none text-slate-100"
            style={{ borderColor: value > 0 ? `${accent}50` : "#334155" }}
          />
          <button
            type="button"
            onClick={() => onChange(cat.key, Math.min(100, value + 1))}
            className="w-6 h-6 rounded bg-[#070A13] border border-slate-700 hover:border-blue-500 text-slate-400 hover:text-white flex items-center justify-center font-mono text-xs font-bold transition-colors"
          >
            +
          </button>
        </div>

        <div
          className="font-mono text-xs font-bold px-2 py-0.5 rounded text-center min-w-[38px]"
          style={{
            background: value > 0 ? `${accent}15` : "transparent",
            color: value > 0 ? accent : "#64748B",
            border: `1px solid ${value > 0 ? `${accent}30` : "transparent"}`,
          }}
        >
          {value}%
        </div>
      </div>
    </div>
  );
}

/* ═══════ Main Risk Weights Configuration Workspace ═══════ */
export default function WeightsPage() {
  const [policyType, setPolicyType] = useState("health");
  const [categories, setCategories] = useState([]);
  const [weights, setWeights] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const total = Object.values(weights).reduce((a, b) => a + Number(b), 0);
  const remaining = 100 - total;
  const isValid = Math.abs(remaining) < 0.5;
  const accent = COLORS[policyType] || "#3B82F6";
  const maxWeight = Math.max(...Object.values(weights), 1);
  const sessionKey = `weights_${policyType}`;

  const fetchWeights = useCallback(async (pt) => {
    setLoading(true);
    setError(null);
    setShowOverlay(false);
    setSimulation(null);
    try {
      const cached = sessionStorage.getItem(`weights_${pt}`);
      if (cached) {
        const p = JSON.parse(cached);
        if (p.weights && p.categories) {
          setCategories(p.categories);
          setWeights(p.weights);
          setLoading(false);
          return;
        }
      }
    } catch {}
    try {
      const res = await fetch(`${PY}/api/ml/weights/${pt}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data.categories || []);
      setWeights(data.weights || {});
      try {
        sessionStorage.setItem(
          `weights_${pt}`,
          JSON.stringify({ weights: data.weights, categories: data.categories })
        );
      } catch {}
    } catch {
      setError("Failed to communicate with Risk Neural Backend. Ensure Python FastAPI service is active.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWeights(policyType);
  }, [policyType, fetchWeights]);

  const handleChange = (key, value) => {
    const nw = { ...weights, [key]: Math.max(0, Math.min(100, value)) };
    setWeights(nw);
    setSimulation(null);
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({ weights: nw, categories }));
    } catch {}
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error(`Weights must sum to precisely 100% (currently ${total}%)`);
      return;
    }
    setSaving(true);
    const url = `${PY}/api/ml/weights`;
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyType, weights }),
      });
      if (r.ok) {
        toast.success(
          `${policyType.toUpperCase()} actuarial weights persisted successfully`
        );
        setShowOverlay(true);
      } else {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || "Failed to commit weights");
      }
    } catch (e) {
      toast.error("Network fault: unable to contact scoring backend");
    }
    setSaving(false);
  };

  const handleReset = async () => {
    try {
      const r = await fetch(`${PY}/api/ml/weights/reset/${policyType}`, { method: "POST" });
      if (r.ok) {
        toast.success("Risk weights reset to actuarial factory baseline");
        sessionStorage.removeItem(sessionKey);
        fetchWeights(policyType);
      } else {
        toast.error("Failed to reset weights");
      }
    } catch {
      toast.error("Failed to reach ML backend");
    }
  };

  const handleSimulate = async () => {
    if (!isValid) return;
    setSimulating(true);
    const ta = {
      applicant: { name: "Test Calibration Subject", age: 45, gender: "male", occupation: "Manager" },
      traditionalData: { income: 1200000, creditScore: 740, existingPolicies: 1 },
      alternativeData: { telematicsScore: 65, behavioralScore: 60, lifestyleScore: 55, socialMediaRisk: "medium" },
      policySpecificData:
        policyType === "health"
          ? { bmi: 27, smokingStatus: "never", exerciseFrequency: 3 }
          : policyType === "auto"
          ? { drivingYears: 10, accidentsLast5: 1, trafficViolations: 1, vehicleYear: 2020, dailyCommute: 25 }
          : policyType === "life"
          ? { smokingStatus: "never", exerciseFrequency: 3, bmi: 27, dependents: 2 }
          : { propertyAge: 15, propertyValue: 6000000, squareFootage: 1000, floodZone: "low", securitySystem: "basic" },
    };
    try {
      const url = `${PY}/api/ml/weights/simulate`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyType, weights, assessment: ta }),
      });
      if (r.ok) {
        const data = await r.json();
        setSimulation(data);
        toast.success(`Simulation completed: ${data.difference > 0 ? "+" : ""}${data.difference} point delta`);
      } else {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error || "Simulation run encountered error");
      }
    } catch (e) {
      toast.error("Unable to execute simulation on backend");
    }
    setSimulating(false);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Breadcrumbs />
        <ErrorState message={error} onRetry={() => fetchWeights(policyType)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Blueprint Header */}
      <FadeUp>
        <div className="blueprint-card p-6 bg-[#070A13] border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[10px] font-mono text-blue-400/40 tracking-wider">
            [SYS.WEIGHT_CALIBRATION_COCKPIT]
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Neural Model Parameter Workspace
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Risk Weight Matrix Calibration
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
                Allocate exactly 100 percentage points across underlying risk dimensions to re-parameterize the multi-tier ensemble model.
              </p>
            </div>

            {/* Policy Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0A0F1D] border border-slate-800">
              {["health", "auto", "life", "property"].map((pt) => (
                <button
                  key={pt}
                  onClick={() => setPolicyType(pt)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    policyType === pt
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FadeUp>

      {loading ? (
        <div className="blueprint-card p-16 text-center bg-[#070A13] border-slate-800">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-slate-400">Querying neural weights from backend cluster...</p>
        </div>
      ) : (
        <>
          {/* Allocation Gauge Bar */}
          <div className="blueprint-card p-4 bg-[#0A0F1D]/90 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Total Allocated Points:
                </span>
                <span
                  className="font-mono text-base font-extrabold"
                  style={{
                    color: isValid ? "#10B981" : total > 100 ? "#F43F5E" : "#F59E0B",
                  }}
                >
                  {total} <span className="text-slate-600 font-normal">/ 100%</span>
                </span>
              </div>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border ${
                  isValid
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : remaining > 0
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {isValid
                  ? "SYSTEM READY FOR COMMIT"
                  : remaining > 0
                  ? `${remaining}% REMAINING TO ALLOCATE`
                  : `${Math.abs(remaining)}% OVER BUDGET`}
              </span>
            </div>

            {/* Visual stacked bar */}
            <div className="h-3 rounded overflow-hidden flex bg-slate-900 border border-slate-800">
              {[...categories]
                .sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0))
                .map((cat) => {
                  const w = weights[cat.key] || 0;
                  if (w === 0) return null;
                  return (
                    <div
                      key={cat.key}
                      title={`${cat.label}: ${w}%`}
                      style={{
                        width: `${w}%`,
                        height: "100%",
                        background: accent,
                        opacity: 0.25 + (w / maxWeight) * 0.75,
                        borderRight: "1px solid rgba(0,0,0,0.4)",
                        transition: "all 0.3s ease",
                      }}
                    />
                  );
                })}
            </div>
          </div>

          {/* Main 2-Column Split: Factor Steppers vs Neural Visualization & Simulation */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Left 2 Cols: Factor Cards */}
            <div className="xl:col-span-2 space-y-2.5">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Feature Weight Parameters
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {categories.length} FACTORS ACTIVE
                </span>
              </div>

              {categories.map((cat) => (
                <WeightCard
                  key={cat.key}
                  cat={cat}
                  value={weights[cat.key] || 0}
                  accent={accent}
                  maxWeight={maxWeight}
                  onChange={handleChange}
                />
              ))}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isValid || saving}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-mono text-xs uppercase font-bold tracking-wider shadow-lg shadow-blue-500/20 transition-all border border-blue-400/30"
                >
                  {saving ? "Persisting..." : "Save Calibration [COMMIT]"}
                </button>
                <button
                  type="button"
                  onClick={handleSimulate}
                  disabled={!isValid || simulating}
                  className="py-2.5 px-4 rounded-lg bg-[#070A13] hover:bg-blue-950/40 disabled:opacity-40 text-blue-400 hover:text-blue-300 font-mono text-xs uppercase font-bold tracking-wider border border-blue-500/30 transition-all"
                >
                  {simulating ? "Testing..." : "Simulate [RUN]"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2.5 px-3 rounded-lg bg-[#070A13] hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-mono text-xs uppercase tracking-wider border border-slate-800 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Right 3 Cols: Neural Visualization & Simulation Results */}
            <div className="xl:col-span-3 space-y-6">
              {/* Neural Network Blueprint */}
              <div className="blueprint-card p-5 bg-[#070A13] border-blue-500/20">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-mono text-xs font-bold">[RADAR.NEURAL_SIGNAL]</span>
                    <span className="text-xs text-slate-300 font-medium">Stacked Architecture Topology</span>
                  </div>
                  <AskAI
                    question="Explain how this neural network diagram works — what do the node sizes and connection thicknesses mean for risk scoring?"
                    label="Explain Topology"
                  />
                </div>

                <NeuralNetwork categories={categories} weights={weights} accent={accent} />

                <div className="text-[10px] text-center mt-3 text-slate-500 font-mono">
                  NODE RADIUS = FACTOR WEIGHT. CONNECTION OPACITY = INFORMATION FLOW DENSITY. PULSES = ACTIVE TELEMETRY.
                </div>
              </div>

              {/* Simulation Response Matrix */}
              {simulation && (
                <div className="blueprint-card p-5 bg-[#070A13] border-blue-500/30">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-400 font-mono text-xs font-bold">[TEST.CALIBRATION_IMPACT]</span>
                      <span className="text-xs text-slate-300 font-medium">Actuarial Benchmark Comparison</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">SAMPLE: 45YO MALE / ₹12L INCOME</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Default */}
                    <div className="p-3.5 rounded-lg bg-[#0A0F1D] border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Baseline Model</span>
                      <div className="font-mono text-3xl font-extrabold text-slate-300 my-1">
                        {simulation.default?.riskScore}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {simulation.default?.decision}
                      </span>
                    </div>

                    {/* Custom Calibration */}
                    <div className="p-3.5 rounded-lg bg-[#0A0F1D] border border-blue-500/40 text-center">
                      <span className="text-[10px] font-mono text-blue-400 uppercase">Your Weights</span>
                      <div className="font-mono text-3xl font-extrabold text-blue-400 my-1">
                        {simulation.custom?.riskScore}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {simulation.custom?.decision}
                      </span>
                    </div>

                    {/* Impact Delta */}
                    <div
                      className={`p-3.5 rounded-lg text-center border ${
                        simulation.difference > 0
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : simulation.difference < 0
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-800/40 border-slate-700 text-slate-400"
                      }`}
                    >
                      <span className="text-[10px] font-mono uppercase">Net Delta</span>
                      <div className="font-mono text-3xl font-extrabold my-1">
                        {simulation.difference > 0 ? `+${simulation.difference}` : simulation.difference}
                      </div>
                      <span className="text-[10px] font-mono uppercase">
                        {simulation.difference > 0
                          ? "Stricter Underwriting"
                          : simulation.difference < 0
                          ? "More Lenient"
                          : "Neutral"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-mono bg-[#0A0F1D] p-3 rounded border border-slate-800/80 leading-relaxed">
                    {simulation.difference === 0
                      ? "Custom weights produce an identical aggregate risk score for this benchmark profile."
                      : simulation.difference > 0
                      ? `Your configuration increases the applicant's risk score by +${simulation.difference} points, which results in more conservative underwriting and higher recommended premium cushions.`
                      : `Your configuration reduces the applicant's risk score by ${simulation.difference} points, establishing a more aggressive customer-acquisition posture with lower premium hurdles.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save Success Dialog */}
      {showOverlay && (
        <SaveOverlay
          weights={weights}
          categories={categories}
          accent={accent}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </div>
  );
}
