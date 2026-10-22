"use client";

export default function AssessmentSummary({ form, policy, docsCount }) {
  return (
    <>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "#52525b" }}>Application Summary</h3>
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { l: "Policy Type", v: policy?.full, accent: true },
          { l: "Applicant", v: form.applicantName || "\u2014" },
          { l: "Email", v: form.applicantEmail || "\u2014" },
          { l: "Age / Gender", v: `${form.age || "\u2014"} yrs / ${form.gender || "\u2014"}` },
          { l: "Occupation", v: form.occupation || "\u2014" },
          { l: "Income", v: form.income ? `\u20B9${Number(form.income).toLocaleString("en-IN")}` : "\u2014" },
          { l: "Credit Score", v: form.creditScore || "\u2014" },
          { l: "Documents", v: `${docsCount} uploaded` },
        ].map(({ l, v, accent }, i) => (
          <div key={l} className="flex justify-between items-center px-5 py-3.5" style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
            <span className="text-xs" style={{ color: "#52525b" }}>{l}</span>
            <span className="text-sm font-semibold" style={{ color: accent ? policy?.color : "#fafafa" }}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}
