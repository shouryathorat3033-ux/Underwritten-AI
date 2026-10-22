"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABEL_MAP = {
  dashboard: "COCKPIT",
  assess: "INTAKE_WIZARD",
  history: "ARCHIVE_LEDGER",
  analytics: "PORTFOLIO_ANALYTICS",
  assessment: "DOSSIER",
  claims: "CLAIMS_REGISTER",
  audit: "AUDIT_LOG",
  compliance: "COMPLIANCE_MATRIX",
  fairness: "FAIRNESS_AUDIT",
  fraud: "FRAUD_RADAR",
  weights: "WEIGHT_CALIBRATION",
  policies: "ACTIVE_POLICIES",
  profile: "ACCOUNT_PROFILE",
};

export default function Breadcrumbs({ items }) {
  const pathname = usePathname();

  const crumbs = items || buildCrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 list-none m-0 p-0 font-mono text-[11px]">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href || i} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-slate-600 select-none">/</span>
              )}
              {isLast ? (
                <span className="text-blue-400 font-bold tracking-wider">
                  [{crumb.label}]
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="no-underline text-slate-500 hover:text-slate-300 transition-colors tracking-wide"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildCrumbs(pathname) {
  if (!pathname) return [];
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [];

  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    const label =
      LABEL_MAP[part] ||
      (part.length === 24 ? "REF_" + part.slice(-6).toUpperCase() : part.toUpperCase());
    crumbs.push({ label, href: path });
  }

  return crumbs;
}
