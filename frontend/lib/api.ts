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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ship_id: shipId }),
  });
  if (!res.ok) throw new Error("Optimization request failed");
  return res.json();
}
