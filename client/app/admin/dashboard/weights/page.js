"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ErrorState from "@/components/ui/ErrorState";
import AskAI from "@/components/ui/AskAI";

const PY = process.env.NEXT_PUBLIC_PYTHON_URL || "http://127.0.0.1:8000";
const COLORS = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };
const POLICY_LABELS = { health: "Health", auto: "Auto", life: "Life", property: "Property" };

/* ═══════ Animated Neural Network ═══════ */
function NeuralNetwork({ categories, weights, accent }) {
  const sorted = useMemo(() => [...categories].sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0)), [categories, weights]);
  const n = sorted.length;
  const hidden = 5;
  const W = 900, H = Math.max(520, n * 48 + 80);
  const cx = [180, 450, 720];
  const mx = Math.max(...Object.values(weights), 1);
  const iY = (i) => 45 + i * ((H - 90) / (n - 1 || 1));
  const hY = (i) => 80 + i * ((H - 160) / (hidden - 1 || 1));
  const oY = H / 2;
  const uid = useMemo(() => Math.random().toString(36).slice(2, 8), []);
  const hiddenLabels = ["Gradient\nBoosting", "Random\nForest", "Ridge\nRegressor", "Cross\nValidation", "Stacking\nLayer"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <filter id={`g-${uid}`}><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id={`sg-${uid}`}><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <radialGradient id={`ng-${uid}`} cx="35%" cy="35%"><stop offset="0%" stopColor={accent} stopOpacity="0.95" /><stop offset="100%" stopColor={accent} stopOpacity="0.3" /></radialGradient>
        <radialGradient id={`og-${uid}`} cx="50%" cy="50%"><stop offset="0%" stopColor={accent} stopOpacity="0.35" /><stop offset="100%" stopColor={accent} stopOpacity="0.03" /></radialGradient>
      </defs>

      {/* Background grid lines for depth */}
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={`grid-${i}`} x1={0} y1={i * (H / 7)} x2={W} y2={i * (H / 7)} stroke="rgba(255,255,255,0.015)" strokeWidth={0.5} />
      ))}

      {/* Input → Hidden connections + particles */}
      {sorted.map((cat, i) => {
        const w = weights[cat.key] || 0;
        const op = Math.max(0.02, w / mx * 0.5);
        const sw = Math.max(0.4, w / mx * 3.5);
        return Array.from({ length: hidden }).map((_, j) => {
          const x1 = cx[0] + 26, y1 = iY(i), x2 = cx[1] - 28, y2 = hY(j);
          const dur = 1.8 + Math.random() * 2.5;
          const del = (i * hidden + j) * 0.06;
          const pid = `p1-${uid}-${i}-${j}`;
          return (
            <g key={`c1-${i}-${j}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={sw} opacity={op} style={{ transition: "all 0.6s" }} />
              {w > 2 && (<>
                <path id={pid} d={`M${x1},${y1} L${x2},${y2}`} fill="none" stroke="none" />
                <circle r={Math.max(1.5, sw * 0.8)} fill={accent} opacity={0.9} filter={`url(#sg-${uid})`}>
                  <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${del}s`}><mpath href={`#${pid}`} /></animateMotion>
                </circle>
              </>)}
            </g>
          );
        });
      })}

      {/* Hidden → Output connections + particles */}
      {Array.from({ length: hidden }).map((_, j) => {
        const x1 = cx[1] + 28, y1 = hY(j), x2 = cx[2] - 44, y2 = oY;
        const pid = `p2-${uid}-${j}`;
        return (
          <g key={`c2-${j}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth={1.8} opacity={0.25} style={{ transition: "all 0.6s" }} />
            <path id={pid} d={`M${x1},${y1} L${x2},${y2}`} fill="none" stroke="none" />
            <circle r={2} fill={accent} opacity={0.8} filter={`url(#sg-${uid})`}>
              <animateMotion dur={`${2 + j * 0.4}s`} repeatCount="indefinite" begin={`${j * 0.3}s`}><mpath href={`#${pid}`} /></animateMotion>
            </circle>
          </g>
        );
      })}

      {/* Input nodes */}
      {sorted.map((cat, i) => {
        const w = weights[cat.key] || 0;
        const r = 10 + (w / mx) * 14;
        const on = w > 0;
        return (
          <g key={`in-${cat.key}`}>
            {/* Pulse ring for high-weight */}
            {w > 8 && (
              <circle cx={cx[0]} cy={iY(i)} r={r + 6} fill="none" stroke={accent} strokeWidth={1} opacity={0.2}>
                <animate attributeName="r" values={`${r + 3};${r + 12};${r + 3}`} dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.04;0.2" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={cx[0]} cy={iY(i)} r={r} fill={on ? `url(#ng-${uid})` : "#18181b"} stroke={accent} strokeWidth={on ? 2 : 0.5} strokeOpacity={on ? 0.8 : 0.06} filter={w > 8 ? `url(#g-${uid})` : undefined} style={{ transition: "all 0.5s" }} />
            {/* Label */}
            <rect x={2} y={iY(i) - 10} width={cx[0] - r - 18} height={20} rx={5} fill="#09090b" opacity={0.8} />
            <text x={cx[0] - r - 14} y={iY(i) + 5} textAnchor="end" fill={on ? "#fafafa" : "#3f3f46"} fontSize="13" fontWeight="600" fontFamily="var(--font-sans, inherit)">{cat.label}</text>
            {/* Weight number inside node */}
            <text x={cx[0]} y={iY(i) + 5} textAnchor="middle" fill="#fff" fontSize={r > 16 ? "13" : "10"} fontWeight="800" fontFamily="monospace">{w}</text>
          </g>
        );
      })}

      {/* Hidden layer nodes — larger with full labels */}
      {hiddenLabels.map((label, j) => {
        const lines = label.split("\n");
        return (
          <g key={`h-${j}`}>
            {/* Outer ring */}
            <circle cx={cx[1]} cy={hY(j)} r={26} fill="rgba(255,255,255,0.015)" stroke={accent} strokeWidth={1.2} strokeOpacity={0.25} />
            {/* Rotating inner ring */}
            <circle cx={cx[1]} cy={hY(j)} r={18} fill="none" stroke={accent} strokeWidth={0.8} strokeOpacity={0.15} strokeDasharray="4 6">
              <animateTransform attributeName="transform" type="rotate" values={`0 ${cx[1]} ${hY(j)};360 ${cx[1]} ${hY(j)}`} dur={`${6 + j * 1.5}s`} repeatCount="indefinite" />
            </circle>
            {/* Label — two lines */}
            <text x={cx[1]} y={hY(j) - 2} textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="700" fontFamily="var(--font-sans, inherit)">{lines[0]}</text>
            {lines[1] && <text x={cx[1]} y={hY(j) + 10} textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="500" fontFamily="var(--font-sans, inherit)">{lines[1]}</text>}
          </g>
        );
      })}

      {/* Output node — large and prominent */}
      <circle cx={cx[2]} cy={oY} r={44} fill={`url(#og-${uid})`} stroke={accent} strokeWidth={2.5} strokeOpacity={0.6} filter={`url(#g-${uid})`} />
      {/* Pulsing outer ring */}
      <circle cx={cx[2]} cy={oY} r={44} fill="none" stroke={accent} strokeWidth={1.5}>
        <animate attributeName="r" values="44;54;44" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.04;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      {/* Second pulse ring */}
      <circle cx={cx[2]} cy={oY} r={44} fill="none" stroke={accent} strokeWidth={0.8}>
        <animate attributeName="r" values="48;60;48" dur="5s" repeatCount="indefinite" begin="1s" />
        <animate attributeName="opacity" values="0.15;0.02;0.15" dur="5s" repeatCount="indefinite" begin="1s" />
      </circle>
      <text x={cx[2]} y={oY - 6} textAnchor="middle" fill={accent} fontSize="18" fontWeight="900" fontFamily="monospace">Risk</text>
      <text x={cx[2]} y={oY + 12} textAnchor="middle" fill={accent} fontSize="18" fontWeight="900" fontFamily="monospace">Score</text>
      <text x={cx[2]} y={oY + 28} textAnchor="middle" fill="#52525b" fontSize="11" fontFamily="var(--font-sans, inherit)">0 — 100</text>

      {/* Layer labels — bigger */}
      <text x={cx[0]} y={H - 10} textAnchor="middle" fill="#71717a" fontSize="13" fontWeight="600" fontFamily="var(--font-sans, inherit)">Input Features (Weighted)</text>
      <text x={cx[1]} y={H - 10} textAnchor="middle" fill="#71717a" fontSize="13" fontWeight="600" fontFamily="var(--font-sans, inherit)">Stacked Ensemble</text>
      <text x={cx[2]} y={H - 10} textAnchor="middle" fill="#71717a" fontSize="13" fontWeight="600" fontFamily="var(--font-sans, inherit)">Risk Output</text>
    </svg>
  );
}

/* ═══════ Save Success Overlay ═══════ */
function SaveOverlay({ weights, categories, accent, onClose }) {
  const sorted = [...categories].sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0));
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "scale-in 0.3s cubic-bezier(0.16,1,0.3,1)",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "90%", maxWidth: 520, background: "#0f0f13",
        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
        padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Success icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fafafa", margin: 0 }}>Weights Saved Successfully</h2>
            <p style={{ fontSize: 12, color: "#71717a", margin: "2px 0 0" }}>Your custom risk configuration is now active</p>
          </div>
        </div>

        {/* Weight distribution visual */}
        <div style={{ marginBottom: 20 }}>
          {/* Stacked bar */}
          <div style={{ display: "flex", height: 24, borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "rgba(255,255,255,0.04)" }}>
            {sorted.filter(c => (weights[c.key] || 0) > 0).map((cat) => {
              const w = weights[cat.key] || 0;
              return (
                <div key={cat.key} title={`${cat.label}: ${w}pts`} style={{
                  width: `${w}%`, height: "100%",
                  background: accent,
                  opacity: 0.3 + (w / total) * 2,
                  borderRight: w > 0 ? "1px solid rgba(0,0,0,0.4)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {w >= 8 && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>{w}</span>}
                </div>
              );
            })}
          </div>

          {/* Weight list */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {sorted.map((cat) => {
              const w = weights[cat.key] || 0;
              return (
                <div key={cat.key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 10,
                  background: w > 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  border: `1px solid ${w > 0 ? "rgba(255,255,255,0.06)" : "transparent"}`,
                }}>
                  <span style={{ fontSize: 12, color: w > 0 ? "#a1a1aa" : "#3f3f46" }}>{cat.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: w > 0 ? accent : "#3f3f46" }}>{w}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} className="btn-primary" style={{ flex: 1, padding: "10px 0", fontSize: 13 }}>Continue</button>
          <AskAI question={`Analyze my custom weight configuration for this policy. I've set: ${sorted.map(c => `${c.label}: ${weights[c.key] || 0}`).join(", ")}. Total: ${total}. Is this a good configuration?`} label="Ask AI About This" />
        </div>
      </div>
    </div>
  );
}

/* ═══════ Weight Card ═══════ */
function WeightCard({ cat, value, accent, maxWeight, onChange }) {
  const pct = maxWeight > 0 ? (value / maxWeight) * 100 : 0;
  return (
    <div className="relative rounded-xl p-4 transition-all duration-300" style={{
      background: value > 0 ? `${accent}06` : "rgba(255,255,255,0.015)",
      border: `1px solid ${value > 0 ? `${accent}18` : "rgba(255,255,255,0.04)"}`,
    }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div style={{ width: `${pct}%`, height: "100%", background: `${accent}06`, transition: "width 0.4s ease" }} />
      </div>
      <div className="relative flex items-center gap-4">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-sm font-medium truncate" style={{ color: value > 0 ? "#fafafa" : "#52525b" }}>{cat.label}</div>
          {cat.default !== value && <div className="text-[10px] font-mono mt-0.5" style={{ color: "#3f3f46" }}>default: {cat.default}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onChange(cat.key, Math.max(0, value - 1))} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", cursor: "pointer", fontSize: 16, fontFamily: "inherit", fontWeight: 700 }}>-</button>
          <input type="number" min="0" max="100" value={value} onChange={(e) => onChange(cat.key, Number(e.target.value) || 0)} className="font-mono text-center font-bold" style={{ width: 48, height: 28, borderRadius: 8, fontSize: 14, background: "rgba(255,255,255,0.04)", border: `1px solid ${value > 0 ? `${accent}30` : "rgba(255,255,255,0.08)"}`, color: value > 0 ? accent : "#52525b", outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => onChange(cat.key, Math.min(100, value + 1))} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", cursor: "pointer", fontSize: 16, fontFamily: "inherit", fontWeight: 700 }}>+</button>
        </div>
        <div className="font-mono text-xs font-bold px-2 py-1 rounded-md" style={{ background: value > 0 ? `${accent}12` : "transparent", color: value > 0 ? accent : "#3f3f46", minWidth: 36, textAlign: "center" }}>{value}%</div>
      </div>
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
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
  console.log("[weights] total:", total, "isValid:", isValid, "weights keys:", Object.keys(weights).length);
  const accent = COLORS[policyType];
  const maxWeight = Math.max(...Object.values(weights), 1);
  const sessionKey = `weights_${policyType}`;

  const fetchWeights = useCallback(async (pt) => {
    setLoading(true); setError(null); setShowOverlay(false); setSimulation(null);
    try {
      const cached = sessionStorage.getItem(`weights_${pt}`);
      if (cached) { const p = JSON.parse(cached); if (p.weights && p.categories) { setCategories(p.categories); setWeights(p.weights); setLoading(false); return; } }
    } catch {}
    try {
      const res = await fetch(`${PY}/api/ml/weights/${pt}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data.categories || []); setWeights(data.weights || {});
      try { sessionStorage.setItem(`weights_${pt}`, JSON.stringify({ weights: data.weights, categories: data.categories })); } catch {}
    } catch { setError("Failed to load weights. Is the Python backend running?"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWeights(policyType); }, [policyType, fetchWeights]);

  const handleChange = (key, value) => {
    const nw = { ...weights, [key]: Math.max(0, Math.min(100, value)) };
    setWeights(nw); setSimulation(null);
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ weights: nw, categories })); } catch {}
  };

  const handleSave = async () => {
    console.log("[weights] handleSave called. isValid:", isValid, "total:", total, "remaining:", remaining, "weights:", weights);
    if (!isValid) { toast.error(`Weights must sum to 100 (currently ${total})`); return; }
    setSaving(true);
    const url = `${PY}/api/ml/weights`;
    console.log("[weights] Saving to:", url, { policyType, weights });
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyType, weights }) });
      console.log("[weights] Save response:", r.status);
      if (r.ok) { toast.success(`${policyType.charAt(0).toUpperCase() + policyType.slice(1)} weights saved successfully`); setShowOverlay(true); }
      else { const d = await r.json().catch(() => ({})); toast.error(d.error || "Failed to save weights"); }
    } catch (e) { console.error("[weights] Save error:", e); toast.error("Cannot reach ML backend — is it running?"); }
    setSaving(false);
  };

  const handleReset = async () => {
    try {
      const r = await fetch(`${PY}/api/ml/weights/reset/${policyType}`, { method: "POST" });
      if (r.ok) { toast.success("Weights reset to defaults"); sessionStorage.removeItem(sessionKey); fetchWeights(policyType); }
      else toast.error("Failed to reset weights");
    } catch { toast.error("Cannot reach ML backend — is it running?"); }
  };

  const handleSimulate = async () => {
    if (!isValid) return;
    setSimulating(true);
    const ta = {
      applicant: { name: "Test Applicant", age: 45, gender: "male", occupation: "Manager" },
      traditionalData: { income: 1200000, creditScore: 740, existingPolicies: 1 },
      alternativeData: { telematicsScore: 65, behavioralScore: 60, lifestyleScore: 55, socialMediaRisk: "medium" },
      policySpecificData: policyType === "health" ? { bmi: 27, smokingStatus: "never", exerciseFrequency: 3 }
        : policyType === "auto" ? { drivingYears: 10, accidentsLast5: 1, trafficViolations: 1, vehicleYear: 2020, dailyCommute: 25 }
        : policyType === "life" ? { smokingStatus: "never", exerciseFrequency: 3, bmi: 27, dependents: 2 }
        : { propertyAge: 15, propertyValue: 6000000, squareFootage: 1000, floodZone: "low", securitySystem: "basic" },
    };
    try {
      const url = `${PY}/api/ml/weights/simulate`;
      console.log("[weights] Simulating:", url, { policyType, weights: Object.keys(weights).length + " keys" });
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policyType, weights, assessment: ta }) });
      console.log("[weights] Simulate response:", r.status);
      if (r.ok) { const data = await r.json(); setSimulation(data); toast.success(`Simulation complete — ${data.difference > 0 ? "+" : ""}${data.difference} point impact`); }
      else { const d = await r.json().catch(() => ({})); toast.error(d.error || "Simulation failed"); }
    } catch (e) { console.error("[weights] Simulate error:", e); toast.error("Cannot reach ML backend — is it running?"); }
    setSimulating(false);
  };

  if (error) return <div><Breadcrumbs /><ErrorState message={error} onRetry={() => fetchWeights(policyType)} /></div>;

  return (
    <div>
      <Breadcrumbs />

      {/* Header + AI insight */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#fafafa" }}>Risk Weight Configuration</h1>
          <p className="text-sm mt-1 mb-3" style={{ color: "#71717a" }}>Distribute 100 points across risk factors to customize your scoring model</p>
          <AskAI question={`I'm configuring risk weights for ${policyType} insurance. Current weights: ${Object.entries(weights).map(([k,v]) => `${k}: ${v}`).join(", ")}. What strategy would you recommend and what are the trade-offs?`} label="Ask AI for weight strategy" />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["health", "auto", "life", "property"]).map((pt) => (
            <button key={pt} onClick={() => setPolicyType(pt)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
              style={{ background: policyType === pt ? `${COLORS[pt]}12` : "transparent", color: policyType === pt ? COLORS[pt] : "#52525b", cursor: "pointer", border: "none", fontFamily: "inherit" }}>
              {pt}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-16 text-center"><div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.08)", borderTopColor: accent, borderRadius: "50%", animation: "spin-anim 0.8s linear infinite", margin: "0 auto" }} /></div>
      ) : (
        <>
          {/* Points bar */}
          <div className="glass-card p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: "#a1a1aa" }}>Points</span>
                <span className="font-mono text-lg font-bold" style={{ color: isValid ? "#10b981" : total > 100 ? "#ef4444" : "#f59e0b" }}>{total}<span style={{ color: "#3f3f46" }}>/100</span></span>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{
                background: isValid ? "rgba(16,185,129,0.1)" : remaining > 0 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                color: isValid ? "#10b981" : remaining > 0 ? "#f59e0b" : "#ef4444",
              }}>
                {isValid ? "Ready" : remaining > 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
              {[...categories].sort((a, b) => (weights[b.key] || 0) - (weights[a.key] || 0)).map((cat) => {
                const w = weights[cat.key] || 0;
                if (w === 0) return null;
                return <div key={cat.key} title={`${cat.label}: ${w}`} style={{ width: `${w}%`, height: "100%", background: accent, opacity: 0.25 + (w / maxWeight) * 0.75, borderRight: "1px solid rgba(0,0,0,0.3)", transition: "all 0.4s" }} />;
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Weight cards */}
            <div className="xl:col-span-2 space-y-2">
              {categories.map((cat) => (
                <WeightCard key={cat.key} cat={cat} value={weights[cat.key] || 0} accent={accent} maxWeight={maxWeight} onChange={handleChange} />
              ))}
              <div className="flex flex-wrap gap-3 pt-4">
                <button onClick={handleSave} disabled={!isValid || saving} className="btn-primary text-sm" style={{ padding: "10px 20px", opacity: isValid ? 1 : 0.4 }}>{saving ? "Saving..." : "Save Config"}</button>
                <button onClick={handleSimulate} disabled={!isValid || simulating} className="btn-secondary text-sm" style={{ padding: "10px 20px", opacity: isValid ? 1 : 0.4 }}>{simulating ? "Running..." : "Test Weights"}</button>
                <button onClick={handleReset} className="btn-secondary text-sm" style={{ padding: "10px 20px" }}>Reset</button>
              </div>
            </div>

            {/* Right column */}
            <div className="xl:col-span-3 space-y-6">
              {/* Neural Network */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>Neural Network Visualization</h3>
                  <AskAI question="Explain how this neural network diagram works — what do the node sizes and connection thicknesses mean for risk scoring?" label="Explain" />
                </div>
                <NeuralNetwork categories={categories} weights={weights} accent={accent} />
                <p className="text-[10px] text-center mt-3" style={{ color: "#3f3f46" }}>Node size = weight importance. Connection thickness = data flow strength. Particles = active signal processing.</p>
              </div>

              {/* Simulation */}
              {simulation && (
                <div className="glass-card p-6" style={{ borderColor: `${accent}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>Weight Simulation</h3>
                    <AskAI question={`My custom weights produced a score of ${simulation.custom.riskScore} vs default ${simulation.default.riskScore} (${simulation.difference > 0 ? "+" : ""}${simulation.difference} points). Weights: ${Object.entries(weights).map(([k,v]) => `${k}:${v}`).join(", ")}. Is this a good configuration?`} label="Ask More" />
                  </div>
                  <p className="text-xs mb-5" style={{ color: "#71717a" }}>
                    Testing on a sample applicant: 45yo male, ₹6L income, CIBIL 700, moderate risk profile.
                    The same applicant is scored with default weights vs your custom weights.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="p-5 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs uppercase font-semibold tracking-wider mb-3" style={{ color: "#71717a" }}>Default Weights</p>
                      <p className="font-mono text-4xl font-bold" style={{ color: "#71717a" }}>{simulation.default.riskScore}</p>
                      <p className="text-sm capitalize mt-2 font-semibold" style={{ color: simulation.default.decision === "approve" ? "#10b981" : simulation.default.decision === "decline" ? "#ef4444" : "#f59e0b" }}>{simulation.default.decision}</p>
                      {simulation.default.premium && (
                        <p className="text-[11px] font-mono mt-1" style={{ color: "#52525b" }}>₹{simulation.default.premium.min?.toLocaleString("en-IN")} – ₹{simulation.default.premium.max?.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    <div className="p-5 rounded-xl text-center" style={{ background: `${accent}06`, border: `1px solid ${accent}25` }}>
                      <p className="text-xs uppercase font-semibold tracking-wider mb-3" style={{ color: accent }}>Your Weights</p>
                      <p className="font-mono text-4xl font-bold" style={{ color: accent }}>{simulation.custom.riskScore}</p>
                      <p className="text-sm capitalize mt-2 font-semibold" style={{ color: simulation.custom.decision === "approve" ? "#10b981" : simulation.custom.decision === "decline" ? "#ef4444" : "#f59e0b" }}>{simulation.custom.decision}</p>
                      {simulation.custom.premium && (
                        <p className="text-[11px] font-mono mt-1" style={{ color: "#52525b" }}>₹{simulation.custom.premium.min?.toLocaleString("en-IN")} – ₹{simulation.custom.premium.max?.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    <div className="p-5 rounded-xl text-center flex flex-col items-center justify-center" style={{ background: simulation.difference > 0 ? "rgba(239,68,68,0.06)" : simulation.difference < 0 ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${simulation.difference > 0 ? "rgba(239,68,68,0.15)" : simulation.difference < 0 ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                      <p className="text-xs uppercase font-semibold tracking-wider mb-3" style={{ color: "#71717a" }}>Impact</p>
                      <p className="font-mono text-3xl font-bold" style={{ color: simulation.difference > 0 ? "#ef4444" : simulation.difference < 0 ? "#10b981" : "#71717a" }}>{simulation.difference > 0 ? "+" : ""}{simulation.difference}</p>
                      <p className="text-xs font-medium mt-2" style={{ color: simulation.difference > 0 ? "#ef4444" : simulation.difference < 0 ? "#10b981" : "#71717a" }}>
                        {simulation.difference > 0 ? "Stricter scoring" : simulation.difference < 0 ? "More lenient" : "No change"}
                      </p>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                      {simulation.difference === 0 ? (
                        "Your custom weights produce the same score as defaults for this test profile. Try adjusting the weights more significantly to see a difference."
                      ) : simulation.difference > 0 ? (
                        `Your weights increase this applicant's risk score by ${simulation.difference} points compared to default weights. This means your configuration is stricter — more applicants will be referred or declined. ${simulation.custom.decision !== simulation.default.decision ? `This changed the decision from "${simulation.default.decision}" to "${simulation.custom.decision}".` : "The decision remains the same despite the score change."}`
                      ) : (
                        `Your weights reduce this applicant's risk score by ${Math.abs(simulation.difference)} points compared to default weights. This means your configuration is more lenient — more applicants will be approved at lower premiums. ${simulation.custom.decision !== simulation.default.decision ? `This changed the decision from "${simulation.default.decision}" to "${simulation.custom.decision}".` : "The decision remains the same despite the score change."}`
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {simulation?.insights && (
                <div className="glass-card p-6" style={{ borderColor: "rgba(16,185,129,0.15)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>AI Insights</h3>
                    <AskAI question={`Deep dive on my weight config: Strategy is "${simulation.insights.strategy}". Traditional weight: ${simulation.insights.traditional_weight}, Alternative: ${simulation.insights.alternative_weight}. Warnings: ${simulation.insights.warnings?.join("; ") || "none"}. What should I change?`} label="Ask More" />
                  </div>
                  <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
                    <div className="text-sm font-semibold mb-1" style={{ color: "#10b981" }}>{simulation.insights.strategy}</div>
                    <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>{simulation.insights.strategy_description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{ l: "Traditional", v: simulation.insights.traditional_weight, c: "#f59e0b" }, { l: "Alternative", v: simulation.insights.alternative_weight, c: "#10b981" }, { l: "Completeness", v: simulation.insights.completeness_weight, c: "#a78bfa" }].map(s => (
                      <div key={s.l} className="p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <p className="font-mono text-xl font-bold" style={{ color: s.c }}>{s.v}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {simulation.insights.warnings?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#f59e0b" }}>Warnings</p>
                      {simulation.insights.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-3 rounded-lg mb-1.5" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          <span style={{ color: "#a1a1aa" }} dangerouslySetInnerHTML={{ __html: w.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fafafa">$1</strong>') }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {simulation.insights.recommendations?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#10b981" }}>Recommendations</p>
                      {simulation.insights.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-3 rounded-lg mb-1.5" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                          <span style={{ color: "#a1a1aa" }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Save overlay */}
      {showOverlay && <SaveOverlay weights={weights} categories={categories} accent={accent} onClose={() => setShowOverlay(false)} />}
    </div>
  );
}
