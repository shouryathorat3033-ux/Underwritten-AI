/**
 * Resolves the Python service base URL at runtime.
 * In Vercel services, bindings are injected into serverless functions at runtime via PYTHON_BACKEND_URL.
 */
export function getPythonBackendUrl() {
  const envUrl = process.env.PYTHON_BACKEND_URL;
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }
  return "http://127.0.0.1:8000";
}

/**
 * Returns the client-side base URL for calling ML and Python endpoints from the browser.
 * In production or Vercel environments with rewrites or API proxies, relative URLs ("") are preferred.
 * In standalone local development (port 3000 calling port 8000 directly), falls back to "http://127.0.0.1:8000".
 */
export function getClientPythonUrl() {
  if (process.env.NEXT_PUBLIC_PYTHON_URL !== undefined) {
    return process.env.NEXT_PUBLIC_PYTHON_URL;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const port = window.location.port;
    if ((host === "localhost" || host === "127.0.0.1") && port === "3000") {
      return "http://127.0.0.1:8000";
    }
    return "";
  }
  return "http://127.0.0.1:8000";
}
