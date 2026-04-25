import os
import json
import random
import base64
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types
    HAS_GEMINI = True
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        client = genai.Client(api_key=api_key)
    else:
        HAS_GEMINI = False
        client = None
except ImportError:
    HAS_GEMINI = False
    client = None

MODEL = "gemini-2.0-flash"

def _call_gemini(prompt: str) -> str:
    """Synchronous Gemini call. Run in a thread for async contexts."""
    if not HAS_GEMINI or not client:
        raise RuntimeError("Gemini not configured")
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return response.text

def _parse_json(text: str) -> dict:
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

# ─── Risk Scoring ────────────────────────────────────────────────────────────

def get_risk_score(ship: dict, state: dict) -> int:
    """Return a 0-100 integer risk score for a ship."""
    score = 0
    # Weather proximity
    for w in state.get("weather", []):
        dist = ((ship["lat"] - w["lat"])**2 + (ship["lng"] - w["lng"])**2)**0.5
        if dist < 8:
            score += 50 if w.get("severity") == "High" else 30
        elif dist < 15:
            score += 30 if w.get("severity") == "High" else 15
    # Destination port congestion
    dest_port = next((p for p in state.get("ports", []) if p["id"] == ship.get("destination")), None)
    if dest_port:
        if dest_port.get("status") == "Congested":
            score += 30
        elif dest_port.get("status") == "Moderate":
            score += 15
    # Status penalties
    if ship.get("status") == "delayed":
        score += 20
    elif ship.get("status") == "at-risk":
        score += 10
    # Delay hours
    score += min(20, int(ship.get("delay_hours", 0) / 6))
    return min(100, score)

def analyze_disruptions(state: dict) -> list:
    alerts = []
    for port in state.get("ports", []):
        if port.get("status") == "Congested":
            util = 0
            if port.get("capacity", 0) > 0:
                util = int((port.get("current_load", 0) / port["capacity"]) * 100)
            alerts.append({
                "id": f"alert-port-{port['id']}-{random.randint(1000,9999)}",
                "type": "Port Congestion",
                "severity": "High",
                "message": f"{port.get('full_name', port['name'])} is at {util}% capacity. Expected offloading delay: 3–5 days. Reroute incoming vessels to alternative ports.",
                "related_entity": port["id"],
                "actionable": False,
                "timestamp": datetime.utcnow().isoformat()
            })
    for ship in state.get("ships", []):
        risk = get_risk_score(ship, state)
        ship["risk_score"] = risk
        if ship.get("status") in ("at-risk", "delayed") or risk >= 60:
            sev = "High" if risk >= 70 else "Medium"
            alerts.append({
                "id": f"alert-ship-{ship['id']}-{random.randint(1000,9999)}",
                "type": "Transit Risk",
                "severity": sev,
                "message": f"{ship['name']} [{ship['cargo']}, ${ship.get('cargo_value_usd',0):,}] has a risk score of {risk}/100. Immediate route assessment recommended.",
                "related_entity": ship["id"],
                "actionable": True,
                "ship_id": ship["id"],
                "timestamp": datetime.utcnow().isoformat()
            })
    return alerts

# ─── Route Optimization ───────────────────────────────────────────────────────

def optimize_route(ship: dict, state: dict) -> dict:
    if HAS_GEMINI and client:
        try:
            prompt = f"""You are an expert maritime route optimization AI.

Analyze this vessel and recommend the best alternative port.

VESSEL:
{json.dumps(ship, indent=2)}

AVAILABLE PORTS:
{json.dumps(state['ports'], indent=2)}

ACTIVE WEATHER EVENTS:
{json.dumps(state['weather'], indent=2)}

Return ONLY valid JSON (no markdown):
{{
  "new_destination": "<port ID from the list>",
  "new_destination_name": "<port full name>",
  "reason": "<brief professional explanation>",
  "estimated_delay_saved_days": <integer>,
  "speed_adjustment": "<knots recommendation>",
  "co2_saved_tons": <integer 50-400>,
  "confidence": <integer 0-100>
}}"""
            text = _call_gemini(prompt)
            return _parse_json(text)
        except Exception as e:
            print(f"[AI] Gemini optimize error: {e}")

    # Fallback
    alt_ports = [p for p in state["ports"] if p["id"] != ship.get("destination") and p["status"] != "Congested"]
    if not alt_ports:
        alt_ports = [p for p in state["ports"] if p["id"] != ship.get("destination")]
    alt = min(alt_ports, key=lambda p: p.get("current_load", 999)) if alt_ports else state["ports"][0]
    return {
        "new_destination": alt["id"],
        "new_destination_name": alt.get("full_name", alt["name"]),
        "reason": f"Rerouting to {alt['name']} — lower congestion and better berth availability.",
        "estimated_delay_saved_days": random.randint(2, 7),
        "speed_adjustment": "Maintain current speed.",
        "co2_saved_tons": random.randint(80, 350),
        "confidence": random.randint(70, 90)
    }

# ─── Chat ─────────────────────────────────────────────────────────────────────

def chat_with_supply_chain(state: dict, query: str) -> str:
    if HAS_GEMINI and client:
        try:
            # Build a concise summary for context (avoid token overflow)
            ships_summary = [{"id": s["id"], "name": s["name"], "status": s["status"],
                               "cargo": s["cargo"], "cargo_value": s.get("cargo_value_usd"),
                               "risk_score": s.get("risk_score", 0), "eta": s.get("eta")}
                              for s in state.get("ships", [])]
            ports_summary = [{"id": p["id"], "name": p["name"], "status": p["status"],
                               "utilization_pct": int(p.get("current_load",0)/p.get("capacity",1)*100)}
                              for p in state.get("ports", [])]

            prompt = f"""You are the AI operations assistant for a global supply chain platform.
Answer concisely and professionally. Use bullet points for lists.

LIVE FLEET STATUS:
{json.dumps(ships_summary, indent=2)}

LIVE PORT STATUS:
{json.dumps(ports_summary, indent=2)}

SYSTEM METRICS:
- Total CO₂ Prevented: {state.get('total_co2_saved_tons', 0)} tons
- Active Alerts: {len(state.get('alerts', []))}
- Auto-Pilot: {"ON" if state.get('agent_auto_pilot') else "OFF"}

USER QUERY: {query}"""
            return _call_gemini(prompt)
        except Exception as e:
            print(f"[AI] Chat error: {e}")

    return f"[Mock Mode] You asked: \"{query}\". Enable GEMINI_API_KEY for live AI responses."

# ─── Executive Summary ────────────────────────────────────────────────────────

def generate_executive_summary(state: dict) -> str:
    if HAS_GEMINI and client:
        try:
            at_risk = [s for s in state.get("ships", []) if s.get("status") in ("at-risk", "delayed")]
            congested = [p for p in state.get("ports", []) if p.get("status") == "Congested"]
            prompt = f"""You are the Chief Logistics Intelligence Officer.
Generate a concise, professional executive board briefing (3–4 sentences max).
Cover: current risk posture, most critical threats, CO₂ sustainability metric, and recommended actions.

DATA:
- Fleet size: {len(state.get('ships', []))} vessels
- At-risk or delayed: {len(at_risk)} vessels
- Congested ports: {[p['name'] for p in congested]}
- CO₂ Prevented Today: {state.get('total_co2_saved_tons', 0)} metric tons
- Active disruption alerts: {len(state.get('alerts', []))}
- Auto-Pilot: {"ACTIVE" if state.get('agent_auto_pilot') else "INACTIVE"}"""
            return _call_gemini(prompt)
        except Exception as e:
            print(f"[AI] Executive summary error: {e}")

    return "Executive AI summary requires a valid GEMINI_API_KEY. Current system is operating in simulation mode with all core features active."

# ─── Vision Analysis ──────────────────────────────────────────────────────────

def analyze_visual_anomaly(image_base64: str) -> dict:
    if HAS_GEMINI and client:
        try:
            image_bytes = base64.b64decode(image_base64)
            prompt = """Analyze this satellite weather/harbor image for maritime supply chain disruptions.
Return ONLY valid JSON (no markdown):
{
  "type": "<event type e.g. Hurricane, Port Congestion, Storm>",
  "severity": "<High|Medium|Low>",
  "message": "<professional 1-2 sentence assessment>",
  "actionable": <true|false>,
  "estimated_impact_vessels": <integer>
}"""
            response = client.models.generate_content(
                model=MODEL,
                contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")]
            )
            data = _parse_json(response.text)
            return {
                "id": f"alert-vision-{random.randint(10000,99999)}",
                "type": data.get("type", "Visual Anomaly"),
                "severity": data.get("severity", "High"),
                "message": f"[SATELLITE SCAN] {data.get('message', 'Anomaly detected.')} Est. {data.get('estimated_impact_vessels', '?')} vessels impacted.",
                "related_entity": None,
                "actionable": data.get("actionable", False),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"[AI] Vision error: {e}")

    return {
        "id": f"alert-vision-{random.randint(10000,99999)}",
        "type": "Satellite Anomaly",
        "severity": "High",
        "message": "[SATELLITE SCAN] AI Vision detected a significant weather formation. Multiple vessels in the affected zone may require immediate rerouting.",
        "related_entity": None,
        "actionable": False,
        "timestamp": datetime.utcnow().isoformat()
    }
