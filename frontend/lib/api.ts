const API_URL = "/api";

export async function getWsUrl(): Promise<string> {
  try {
    const res = await fetch("/api/config");
    const { wsUrl } = await res.json();
    return wsUrl as string;
  } catch {
    return "ws://localhost:8000/ws";
  }
}

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

export const fetchNews = () => apiFetch("/news");

export async function whatIfAnalysis(scenario: string) {
  return apiFetch("/what-if", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
}

export async function costEstimate(data: { origin: string; destination: string; cargo_type: string; weight_tons: number; urgency: string }) {
  return apiFetch("/cost-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

