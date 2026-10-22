"use client";

const highlights = [
  "IRDAI CIRCULAR 2020 COMPLIANT",
  "LOCAL GEMMA 4 E4B REASONING",
  "STACKED ENSEMBLE R² = 0.978",
  "MULTIMODAL DOCUMENT OCR",
  "ACTUARIAL GLM TARIFF MODELING",
  "DISPARATE IMPACT BIAS AUDITED",
  "END-TO-END CRYPTOGRAPHIC AUDIT",
  "SUB-SECOND RISK ASSESSMENT",
];

export default function TrustBar() {
  const items = [...highlights, ...highlights];
  return (
    <div className="py-4 overflow-hidden relative bg-[#070a13] border-y border-blue-500/15">
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-[#070a13] to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-[#070a13] to-transparent" />
      <div className="flex items-center whitespace-nowrap" style={{ animation: "marquee-scroll 45s linear infinite", width: "max-content" }}>
        {items.map((h, i) => (
          <div key={i} className="flex items-center gap-6 px-8">
            <span className="font-mono text-xs font-medium tracking-[0.15em] text-slate-400 uppercase">
              {h}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
          </div>
        ))}
      </div>
    </div>
  );
}
