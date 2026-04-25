const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

export { WS_URL };

export async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...opts });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

export const fetchState = () => apiFetch("/state");
export const fetchAlerts = () => apiFetch("/alerts");
export const fetchFleet = () => apiFetch("/fleet");
export const fetchPorts = () => apiFetch("/ports");
export const fetchMetrics = () => apiFetch("/metrics");
export const fetchHistory = () => apiFetch("/history");
export const fetchOptimizationLog = () => apiFetch("/optimization-log");

export async function requestOptimization(shipId: string) {
  return apiFetch("/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ship_id: shipId }),
  });
}

export async function toggleAutopilot() {
  return apiFetch("/toggle-autopilot", { method: "POST" });
}

export async function chatWithAI(query: string) {
  return apiFetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
}

export async function fetchExecutiveSummary() {
  return apiFetch("/executive-summary", { method: "POST" });
}

export async function analyzeVision(base64Image: string) {
  return apiFetch("/analyze-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: base64Image }),
  });
}
