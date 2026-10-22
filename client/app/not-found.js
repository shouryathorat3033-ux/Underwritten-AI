import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#09090b" }}>
      <div className="text-center">
        <h1 className="font-mono text-6xl font-bold mb-4" style={{ color: "#10b981" }}>404</h1>
        <p className="text-lg mb-6" style={{ color: "#a1a1aa" }}>Page not found</p>
        <Link href="/" className="btn-primary no-underline">Go Home</Link>
      </div>
    </div>
  );
}
