const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchState() {
  const res = await fetch(`${API_URL}/state`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch state");
  return res.json();
}

export async function fetchAlerts() {
  const res = await fetch(`${API_URL}/alerts`, { cache: 'no-store' });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

export async function requestOptimization(shipId: string) {
  const res = await fetch(`${API_URL}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ship_id: shipId }),
  });
  if (!res.ok) throw new Error("Optimization request failed");
  return res.json();
}

export async function toggleAutopilot() {
  const res = await fetch(`${API_URL}/toggle-autopilot`, { method: "POST" });
  if (!res.ok) throw new Error("Toggle request failed");
  return res.json();
}

export async function chatWithAI(query: string) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

export async function analyzeVision(base64Image: string) {
  const res = await fetch(`${API_URL}/analyze-vision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: base64Image }),
  });
  if (!res.ok) throw new Error("Vision request failed");
  return res.json();
}
