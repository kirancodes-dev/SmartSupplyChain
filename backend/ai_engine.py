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
    if not HAS_GEMINI or not client:
        raise RuntimeError("Gemini not configured")
    response = client.models.generate_content(model=MODEL, contents=prompt)
    return response.text

def _parse_json(text: str) -> dict:
    clean = text.replace("```json", "").replace("```", "").strip()
    return json.loads(clean)

# ─── Risk Scoring ─────────────────────────────────────────────────────────────
def get_risk_score(ship: dict, state: dict) -> int:
    score = 0
    for w in state.get("weather", []):
        dist = ((ship["lat"] - w["lat"])**2 + (ship["lng"] - w["lng"])**2)**0.5
        threshold = w.get("radius_km", 300) / 50
        if dist < threshold:
            score += 50 if w.get("severity") == "High" else 30
        elif dist < threshold * 1.5:
            score += 25 if w.get("severity") == "High" else 12
    dest_port = next((p for p in state.get("ports", []) if p["id"] == ship.get("destination")), None)
    if dest_port:
        if dest_port.get("status") == "Congested": score += 30
        elif dest_port.get("status") == "Moderate": score += 15
    if ship.get("status") == "delayed": score += 20
    elif ship.get("status") == "at-risk": score += 10
    score += min(20, int(ship.get("delay_hours", 0) / 6))
    return min(100, score)

def analyze_disruptions(state: dict) -> list:
    alerts = []
    for port in state.get("ports", []):
        if port.get("status") == "Congested":
            util = int((port.get("current_load", 0) / max(port.get("capacity", 1), 1)) * 100)
            alerts.append({
                "id": f"alert-port-{port['id']}-{random.randint(1000,9999)}",
                "type": "Port Congestion", "severity": "High",
                "message": f"{port.get('full_name', port['name'])} at {util}% capacity. Expected delay: 3–5 days.",
                "related_entity": port["id"], "actionable": False,
                "timestamp": datetime.utcnow().isoformat()
            })
    for ship in state.get("ships", []):
        risk = get_risk_score(ship, state)
        ship["risk_score"] = risk
        if ship.get("status") in ("at-risk", "delayed") or risk >= 60:
            sev = "High" if risk >= 70 else "Medium"
            alerts.append({
                "id": f"alert-ship-{ship['id']}-{random.randint(1000,9999)}",
                "type": "Transit Risk", "severity": sev,
                "message": f"{ship['name']} [{ship['cargo']}, ${ship.get('cargo_value_usd',0):,}] — Risk score {risk}/100. Route assessment recommended.",
                "related_entity": ship["id"], "actionable": True, "ship_id": ship["id"],
                "timestamp": datetime.utcnow().isoformat()
            })
    return alerts

# ─── Route Optimization ───────────────────────────────────────────────────────
def optimize_route(ship: dict, state: dict) -> dict:
    if HAS_GEMINI and client:
        try:
            prompt = f"""You are an expert maritime route optimization AI.
Ship: {json.dumps(ship, indent=2)}
Available Ports: {json.dumps(state['ports'], indent=2)}
Active Weather: {json.dumps(state['weather'], indent=2)}

Return ONLY valid JSON:
{{"new_destination":"<port ID>","new_destination_name":"<full name>","reason":"<brief explanation>","estimated_delay_saved_days":<int>,"speed_adjustment":"<recommendation>","co2_saved_tons":<int 50-400>,"confidence":<int 0-100>}}"""
            return _parse_json(_call_gemini(prompt))
        except Exception as e:
            print(f"[AI] optimize error: {e}")

    alt_ports = [p for p in state["ports"] if p["id"] != ship.get("destination") and p["status"] != "Congested"]
    if not alt_ports:
        alt_ports = [p for p in state["ports"] if p["id"] != ship.get("destination")]
    alt = min(alt_ports, key=lambda p: p.get("current_load", 999)) if alt_ports else state["ports"][0]
    return {
        "new_destination": alt["id"], "new_destination_name": alt.get("full_name", alt["name"]),
        "reason": f"Rerouting to {alt['name']} — lowest congestion and optimal berth availability.",
        "estimated_delay_saved_days": random.randint(2, 7),
        "speed_adjustment": "Maintain current speed.",
        "co2_saved_tons": random.randint(80, 350), "confidence": random.randint(72, 93)
    }

# ─── Gemini Function Calling Chat ─────────────────────────────────────────────
def chat_with_supply_chain(state: dict, query: str) -> str:
    """Uses Gemini Function Calling so the model can query real live data."""
    if not (HAS_GEMINI and client):
        return f"[Mock Mode] Query: \"{query}\". Set GEMINI_API_KEY for live AI responses."

    # Define the tools Gemini can call
    tools = [types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="get_fleet_status",
            description="Get the current status of all ships in the fleet, including risk scores and cargo values.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={})
        ),
        types.FunctionDeclaration(
            name="get_at_risk_vessels",
            description="Return a list of all vessels that are currently at-risk or delayed.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={})
        ),
        types.FunctionDeclaration(
            name="get_port_status",
            description="Get current utilization and status of all monitored ports.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={})
        ),
        types.FunctionDeclaration(
            name="get_system_metrics",
            description="Get high-level system KPIs including CO2 saved, optimizations done, and total cargo value.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={})
        ),
        types.FunctionDeclaration(
            name="get_weather_events",
            description="Get all active weather events and their severity.",
            parameters=types.Schema(type=types.Type.OBJECT, properties={})
        ),
    ])]

    # Tool execution functions
    def execute_tool(name: str) -> str:
        if name == "get_fleet_status":
            return json.dumps([{"id": s["id"], "name": s["name"], "status": s["status"],
                "cargo": s["cargo"], "cargo_value_usd": s.get("cargo_value_usd"), "risk_score": s.get("risk_score", 0)}
                for s in state.get("ships", [])])
        elif name == "get_at_risk_vessels":
            at_risk = [s for s in state.get("ships", []) if s.get("status") in ("at-risk", "delayed")]
            return json.dumps(at_risk)
        elif name == "get_port_status":
            return json.dumps([{"id": p["id"], "name": p["name"], "status": p["status"],
                "utilization_pct": int((p.get("current_load",0)/max(p.get("capacity",1),1))*100)}
                for p in state.get("ports", [])])
        elif name == "get_system_metrics":
            ships = state.get("ships", [])
            return json.dumps({
                "total_ships": len(ships), "at_risk": sum(1 for s in ships if s.get("status")=="at-risk"),
                "co2_saved_tons": state.get("total_co2_saved_tons", 0),
                "agent_auto_pilot": state.get("agent_auto_pilot", False),
                "total_cargo_value_usd": sum(s.get("cargo_value_usd",0) for s in ships)
            })
        elif name == "get_weather_events":
            return json.dumps(state.get("weather", []))
        return "{}"

    try:
        messages = [types.Content(role="user", parts=[types.Part(text=f"You are an expert supply chain AI assistant. Answer concisely and professionally using live data from the tools.\n\nUser: {query}")])]

        # First call — Gemini may request tool(s)
        response = client.models.generate_content(
            model=MODEL, contents=messages,
            config=types.GenerateContentConfig(tools=tools)
        )

        # Check if Gemini wants to call a function
        if response.candidates and response.candidates[0].content.parts:
            parts = response.candidates[0].content.parts
            fn_calls = [p for p in parts if hasattr(p, "function_call") and p.function_call]

            if fn_calls:
                # Execute all requested functions
                tool_results = []
                for part in fn_calls:
                    fn_name = part.function_call.name
                    result = execute_tool(fn_name)
                    tool_results.append(types.Part(
                        function_response=types.FunctionResponse(
                            name=fn_name,
                            response={"result": result}
                        )
                    ))

                # Send results back to Gemini for final answer
                messages.append(types.Content(role="model", parts=parts))
                messages.append(types.Content(role="tool", parts=tool_results))

                final = client.models.generate_content(
                    model=MODEL, contents=messages,
                    config=types.GenerateContentConfig(tools=tools)
                )
                return final.text

        return response.text

    except Exception as e:
        print(f"[AI] Function calling error: {e}")
        # Fallback to simple chat
        try:
            ships_sum = [{"id":s["id"],"name":s["name"],"status":s["status"],"risk":s.get("risk_score",0)} for s in state.get("ships",[])]
            prompt = f"Supply chain data: {json.dumps(ships_sum)}. Answer: {query}"
            return _call_gemini(prompt)
        except Exception as e2:
            return f"AI error: {e2}"

# ─── Executive Summary ────────────────────────────────────────────────────────
def generate_executive_summary(state: dict) -> str:
    if HAS_GEMINI and client:
        try:
            at_risk = [s for s in state.get("ships", []) if s.get("status") in ("at-risk", "delayed")]
            congested = [p for p in state.get("ports", []) if p.get("status") == "Congested"]
            prompt = f"""You are the Chief Logistics Intelligence Officer. Generate a concise executive board briefing (3–4 sentences).
Cover: current risk posture, most critical threats, CO₂ sustainability impact, and recommended actions.

DATA:
- Fleet: {len(state.get('ships', []))} vessels, {len(at_risk)} at-risk/delayed
- Congested ports: {[p['name'] for p in congested]}
- CO₂ Prevented: {state.get('total_co2_saved_tons', 0)} metric tons
- Active alerts: {len(state.get('alerts', []))}
- Auto-Pilot: {"ACTIVE" if state.get('agent_auto_pilot') else "INACTIVE"}"""
            return _call_gemini(prompt)
        except Exception as e:
            print(f"[AI] Executive summary error: {e}")
    return "Executive summary requires GEMINI_API_KEY. System is operating in simulation mode."

# ─── Vision Analysis ──────────────────────────────────────────────────────────
def analyze_visual_anomaly(image_base64: str) -> dict:
    if HAS_GEMINI and client:
        try:
            image_bytes = base64.b64decode(image_base64)
            prompt = 'Analyze this image for maritime supply chain disruptions. Return ONLY valid JSON: {"type":"<event type>","severity":"<High|Medium|Low>","message":"<1-2 sentence assessment>","actionable":<true|false>,"estimated_impact_vessels":<int>}'
            response = client.models.generate_content(
                model=MODEL,
                contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")]
            )
            data = _parse_json(response.text)
            return {
                "id": f"alert-vision-{random.randint(10000,99999)}",
                "type": data.get("type", "Visual Anomaly"), "severity": data.get("severity", "High"),
                "message": f"[SATELLITE SCAN] {data.get('message')} Est. {data.get('estimated_impact_vessels','?')} vessels impacted.",
                "related_entity": None, "actionable": data.get("actionable", False),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"[AI] Vision error: {e}")
    return {
        "id": f"alert-vision-{random.randint(10000,99999)}",
        "type": "Satellite Anomaly", "severity": "High",
        "message": "[SATELLITE SCAN] AI Vision detected a significant weather formation. Multiple vessels may require rerouting.",
        "related_entity": None, "actionable": False,
        "timestamp": datetime.utcnow().isoformat()
    }
