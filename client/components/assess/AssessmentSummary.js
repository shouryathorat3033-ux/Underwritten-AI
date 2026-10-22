"use client";

export default function AssessmentSummary({ form, policy, docsCount }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          [APPLICATION_TELEMETRY_SUMMARY]
        </h3>
        <span className="text-[10px] font-mono text-blue-400">// VERIFIED_INPUTS</span>
      </div>
      <div className="blueprint-card overflow-hidden">
        {[
          { l: "Policy Type", v: policy?.full, accent: true },
          { l: "Applicant", v: form.applicantName || "\u2014" },
          { l: "Email", v: form.applicantEmail || "\u2014" },
          { l: "Demographics", v: `${form.age || "\u2014"} yrs · ${form.gender || "\u2014"}` },
          { l: "Occupation", v: form.occupation || "\u2014" },
          { l: "Income (INR)", v: form.income ? `\u20B9${Number(form.income).toLocaleString("en-IN")}` : "\u2014" },
          { l: "Credit Score", v: form.creditScore || "\u2014" },
          { l: "Attached Documents", v: `${docsCount} verified payload(s)` },
        ].map(({ l, v, accent }, i) => (
          <div
            key={l}
            className="flex justify-between items-center px-4 py-3 font-mono"
            style={{
              background: i % 2 === 0 ? "rgba(14,21,38,0.7)" : "rgba(10,15,29,0.5)",
              borderBottom: i < 7 ? "1px solid rgba(37,99,235,0.12)" : "none"
            }}
          >
            <span className="text-xs text-slate-400">{l}</span>
            <span className="text-xs font-semibold text-white" style={{ color: accent ? "#60A5FA" : "#FFFFFF" }}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}
