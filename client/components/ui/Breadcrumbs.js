"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LABEL_MAP = {
  dashboard: "Dashboard",
  assess: "New Assessment",
  history: "History",
  analytics: "Analytics",
  assessment: "Assessment",
};

export default function Breadcrumbs({ items }) {
  const pathname = usePathname();

  const crumbs = items || buildCrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
      <ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0 }}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href || i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              {isLast ? (
                <span style={{ fontSize: 13, fontWeight: 500, color: "#fafafa" }}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="no-underline"
                  style={{ fontSize: 13, color: "#71717a", transition: "color 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
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
    const label = LABEL_MAP[part] || (part.length === 24 ? "Details" : part.charAt(0).toUpperCase() + part.slice(1));
    crumbs.push({ label, href: path });
  }

  return crumbs;
}
