// Single source of truth for the backend base URL.
// Set NEXT_PUBLIC_API_URL in .env.local (and in your deploy env) to point at
// the deployed FastAPI backend. Falls back to localhost for dev.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Build a full backend URL from an /api path. */
export const apiUrl = (path: string): string =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
