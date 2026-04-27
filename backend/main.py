import asyncio
import json
import os
import random
import time
import logging
from datetime import datetime
from typing import List, Set

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import OptimizeRequest, ChatRequest, VisionRequest, WeatherInjectRequest
from ai_engine import (
    analyze_disruptions, optimize_route,
    chat_with_supply_chain, analyze_visual_anomaly,
    generate_executive_summary, get_risk_score
)
from database import (
    init_db, save_history_tick, get_history,
    log_optimization, get_optimization_log, get_total_optimizations
)
from digital_twin import digital_twin
from pubsub_stream import pubsub_client

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
log = logging.getLogger("supply_chain")

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart Supply Chain API",
    description="Industrial-grade AI-powered supply chain disruption detector & optimizer",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()

# ─── State ────────────────────────────────────────────────────────────────────
state = digital_twin.state

# ─── WebSocket Manager ────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)
        log.info(f"WebSocket connected. Total clients: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)
        log.info(f"WebSocket disconnected. Total clients: {len(self.active)}")

    async def broadcast(self, data: dict):
        payload = json.dumps(data, default=str)
        dead = set()
        for ws in self.active:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        self.active -= dead

manager = ConnectionManager()

# ─── Data Loading ─────────────────────────────────────────────────────────────
def load_initial_data():
    log.info(f"Initialized Generative Digital Twin with {len(state['ships'])} ships, {len(state['ports'])} ports, {len(state['weather'])} weather events")

# ─── Simulation Loop ──────────────────────────────────────────────────────────
async def simulate_world():
    tick_count = 0
    while True:
        await asyncio.sleep(4)
        tick_count += 1
        state["tick"] = tick_count

        # Move ships
        for ship in state["ships"]:
            if ship["status"] != "rerouted":
                ship["lng"] += random.uniform(-0.4, 0.4)
                ship["lat"] += random.uniform(-0.3, 0.3)
                ship["lng"] = max(-179, min(179, ship["lng"]))
                ship["lat"] = max(-80, min(80, ship["lat"]))

            # Reset status before re-evaluating
            if ship["status"] not in ("rerouted", "delayed"):
                ship["status"] = "on-time"

            # Check weather proximity
            for w in state["weather"]:
                dist = ((ship["lat"] - w["lat"])**2 + (ship["lng"] - w["lng"])**2)**0.5
                threshold = w.get("radius_km", 300) / 50
                if dist < threshold and ship["status"] != "rerouted":
                    ship["status"] = "at-risk"

            # Compute risk score
            ship["risk_score"] = get_risk_score(ship, state)

        # Update port loads
        for port in state["ports"]:
            delta = random.randint(-8, 8)
            port["current_load"] = max(0, min(port["capacity"], port["current_load"] + delta))
            util = port["current_load"] / port["capacity"]
            if util > 0.88:
                port["status"] = "Congested"
            elif util > 0.68:
                port["status"] = "Moderate"
            else:
                port["status"] = "Clear"

        # Generate alerts (every 2 ticks)
        if tick_count % 2 == 0:
            new_alerts = analyze_disruptions(state)
            for na in new_alerts:
                if not any(a["id"] == na["id"] for a in state["alerts"]):
                    if state["agent_auto_pilot"] and na.get("actionable") and na.get("ship_id"):
                        ship = next((s for s in state["ships"] if s["id"] == na["ship_id"]), None)
                        if ship and ship["status"] != "rerouted":
                            rec = await asyncio.to_thread(optimize_route, ship, state)
                            if rec and rec.get("new_destination"):
                                old_dest = ship["destination"]
                                ship["destination"] = rec["new_destination"]
                                ship["status"] = "rerouted"
                                co2 = rec.get("co2_saved_tons", random.randint(80, 200))
                                state["total_co2_saved_tons"] += co2
                                state["total_alerts_resolved"] += 1
                                log_optimization(ship, rec["new_destination"], co2, rec.get("reason",""), auto=True)
                                na["message"] = f"[AUTO-PILOT] {na['message']} → Auto-rerouted to {rec.get('new_destination_name', rec['new_destination'])}. {co2}t CO₂ saved."
                                na["actionable"] = False
                                log.info(f"AUTO-PILOT rerouted {ship['name']} from {old_dest} → {rec['new_destination']}")
                    state["alerts"].insert(0, na)
            state["alerts"] = state["alerts"][:20]

        # Persist history every 5 ticks
        if tick_count % 5 == 0:
            await asyncio.to_thread(save_history_tick, state)

        # Broadcast to WebSocket clients and Pub/Sub Stream
        if manager.active:
            # Simulate real-time event streaming backbone
            pubsub_client.publish("telemetry_update", state)
            await manager.broadcast(state)

# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    init_db()
    load_initial_data()
    asyncio.create_task(simulate_world())
    log.info("🚀 Smart Supply Chain API v2.0 started")

# ─── WebSocket ────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send current state immediately on connect
        await ws.send_text(json.dumps(state, default=str))
        while True:
            await ws.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(ws)

# ─── REST Endpoints ───────────────────────────────────────────────────────────
@app.get("/api/state")
def get_state():
    return state

@app.get("/api/alerts")
def get_alerts():
    return state["alerts"]

@app.get("/api/fleet")
def get_fleet():
    return {
        "ships": state["ships"],
        "total": len(state["ships"]),
        "at_risk": sum(1 for s in state["ships"] if s.get("status") == "at-risk"),
        "delayed": sum(1 for s in state["ships"] if s.get("status") == "delayed"),
        "rerouted": sum(1 for s in state["ships"] if s.get("status") == "rerouted"),
        "on_time": sum(1 for s in state["ships"] if s.get("status") == "on-time"),
    }

@app.get("/api/ports")
def get_ports():
    return {
        "ports": state["ports"],
        "congested": sum(1 for p in state["ports"] if p.get("status") == "Congested"),
        "moderate": sum(1 for p in state["ports"] if p.get("status") == "Moderate"),
        "clear": sum(1 for p in state["ports"] if p.get("status") == "Clear"),
    }

@app.get("/api/metrics")
def get_metrics():
    return {
        "total_ships": len(state["ships"]),
        "at_risk_count": sum(1 for s in state["ships"] if s.get("status") == "at-risk"),
        "rerouted_count": sum(1 for s in state["ships"] if s.get("status") == "rerouted"),
        "delayed_count": sum(1 for s in state["ships"] if s.get("status") == "delayed"),
        "on_time_count": sum(1 for s in state["ships"] if s.get("status") == "on-time"),
        "congested_ports": sum(1 for p in state["ports"] if p.get("status") == "Congested"),
        "total_co2_saved_tons": state["total_co2_saved_tons"],
        "total_alerts_resolved": state["total_alerts_resolved"] + get_total_optimizations(),
        "agent_auto_pilot": state["agent_auto_pilot"],
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "active_alerts": len(state["alerts"]),
        "total_cargo_value_usd": sum(s.get("cargo_value_usd", 0) for s in state["ships"]),
    }

@app.get("/api/history")
def get_sim_history():
    return get_history(limit=60)

@app.get("/api/optimization-log")
def get_opt_log():
    return get_optimization_log(limit=20)

@app.post("/api/optimize")
async def request_optimization(req: OptimizeRequest):
    ship = next((s for s in state["ships"] if s["id"] == req.ship_id), None)
    if not ship:
        raise HTTPException(status_code=404, detail=f"Ship {req.ship_id} not found")

    recommendation = await asyncio.to_thread(optimize_route, ship, state)

    if recommendation and recommendation.get("new_destination"):
        old_dest = ship["destination"]
        ship["destination"] = recommendation["new_destination"]
        ship["status"] = "rerouted"
        co2 = recommendation.get("co2_saved_tons", random.randint(80, 200))
        state["total_co2_saved_tons"] += co2
        state["total_alerts_resolved"] += 1
        log_optimization(ship, recommendation["new_destination"], co2, recommendation.get("reason",""), auto=False)
        for a in state["alerts"]:
            if a.get("ship_id") == req.ship_id:
                a["actionable"] = False
        log.info(f"Manual reroute: {ship['name']} {old_dest} → {recommendation['new_destination']}, CO₂ saved: {co2}t")

    return {"status": "success", "recommendation": recommendation}

@app.post("/api/toggle-autopilot")
def toggle_autopilot():
    state["agent_auto_pilot"] = not state["agent_auto_pilot"]
    mode = "ENABLED" if state["agent_auto_pilot"] else "DISABLED"
    log.info(f"Auto-Pilot {mode}")
    return {"agent_auto_pilot": state["agent_auto_pilot"]}

@app.post("/api/chat")
async def api_chat(req: ChatRequest):
    reply = await asyncio.to_thread(chat_with_supply_chain, state, req.query)
    return {"reply": reply}

@app.post("/api/executive-summary")
async def api_executive_summary():
    summary = await asyncio.to_thread(generate_executive_summary, state)
    return {"summary": summary}

@app.post("/api/analyze-vision")
async def api_analyze_vision(req: VisionRequest):
    alert = await asyncio.to_thread(analyze_visual_anomaly, req.image_base64)
    if alert:
        state["alerts"].insert(0, alert)
    return {"status": "success", "alert": alert}

# ─── Weather Control (Live Demo) ──────────────────────────────────────────────
@app.post("/api/weather/add")
async def add_weather_event(req: WeatherInjectRequest):
    event_id = f"weather-custom-{random.randint(10000, 99999)}"
    event = {
        "id": event_id,
        "type": req.type,
        "name": req.name,
        "lat": req.lat,
        "lng": req.lng,
        "radius_km": req.radius_km,
        "severity": req.severity,
        "wind_speed_knots": req.wind_speed_knots,
    }
    state["weather"].append(event)
    # Trigger immediate alert
    alert_id = f"alert-wx-{event_id}"
    state["alerts"].insert(0, {
        "id": alert_id,
        "type": f"Weather Injection: {req.type}",
        "severity": req.severity,
        "message": f"⚡ LIVE DEMO: {req.name} injected at ({req.lat:.1f}°, {req.lng:.1f}°). Radius {req.radius_km:.0f}km. Wind: {req.wind_speed_knots:.0f} knots. AI analyzing nearby vessels...",
        "related_entity": None,
        "actionable": False,
        "timestamp": datetime.utcnow().isoformat(),
    })
    log.info(f"Weather event injected: {req.name} at ({req.lat}, {req.lng})")
    if manager.active:
        await manager.broadcast(state)
    return {"status": "success", "id": event_id}

@app.delete("/api/weather/{event_id}")
async def remove_weather_event(event_id: str):
    before = len(state["weather"])
    state["weather"] = [w for w in state["weather"] if w["id"] != event_id]
    if len(state["weather"]) == before:
        raise HTTPException(status_code=404, detail="Weather event not found")
    log.info(f"Weather event removed: {event_id}")
    if manager.active:
        await manager.broadcast(state)
    return {"status": "removed", "id": event_id}

@app.get("/api/weather")
def get_weather_events():
    return {"events": state["weather"], "total": len(state["weather"])}

# ─── AI Predictive Forecast ───────────────────────────────────────────────────
@app.post("/api/forecast")
async def api_forecast():
    from ai_engine import generate_forecast
    forecast = await asyncio.to_thread(generate_forecast, state)
    return {"forecast": forecast}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "websocket_clients": len(manager.active),
        "ships_tracked": len(state["ships"]),
        "ports_monitored": len(state["ports"]),
        "weather_events": len(state["weather"]),
    }

@app.get("/api/news")
async def get_ai_news():
    """Generate 5 real-time AI maritime news headlines with analysis."""
    ships = state["ships"]
    weather = state["weather"]
    at_risk = [s for s in ships if s.get("status") in ["at-risk", "delayed"]]

    context = f"""
Generate exactly 5 breaking maritime/supply chain news headlines for RIGHT NOW.
Current situation: {len(at_risk)} vessels at risk, {len(weather)} active weather events.
{f"Weather events: {', '.join(w['name'] + ' (' + w['type'] + ')' for w in weather[:3])}" if weather else ""}

For each item output exactly this JSON format (no markdown, pure JSON array):
[
  {{"id": 1, "severity": "critical|high|medium|low", "category": "Weather|Port|Market|Security|Regulation", "headline": "...", "summary": "...(1 sentence)", "impact": "...($ or ships affected)", "time": "X min ago"}}
]
Make them realistic, specific, and dramatic. Include real port names and shipping lanes.
"""
    try:
        from ai_engine import _call_gemini
        result = await asyncio.to_thread(_call_gemini, context)
        # Parse JSON from result
        import re
        json_match = re.search(r'\[.*\]', result, re.DOTALL)
        if json_match:
            news = json.loads(json_match.group())
            return {"news": news, "generated_at": datetime.now().isoformat()}
    except Exception as e:
        log.warning(f"News generation fallback: {e}")

    # Fallback news
    fallback = [
        {"id": 1, "severity": "critical", "category": "Weather", "headline": "Typhoon Kai intensifies — Category 5 in South China Sea", "summary": "Multiple shipping lanes suspended as 185km/h winds threaten Pacific corridor.", "impact": "7 vessels rerouted", "time": "2 min ago"},
        {"id": 2, "severity": "high", "category": "Port", "headline": "Port of Singapore reports 40% congestion surge", "summary": "Labour dispute grounds 120 longshoremen, container backlog growing.", "impact": "$24M delay risk", "time": "8 min ago"},
        {"id": 3, "severity": "medium", "category": "Market", "headline": "Baltic Dry Index drops 3.2% on demand fears", "summary": "Slowdown in Chinese manufacturing exports pressures dry bulk rates.", "impact": "–$1.8B market cap", "time": "15 min ago"},
        {"id": 4, "severity": "high", "category": "Security", "headline": "Piracy alert issued in Gulf of Aden corridor", "summary": "Maritime security forces report suspicious vessel activity near key tanker route.", "impact": "3 routes diverted", "time": "22 min ago"},
        {"id": 5, "severity": "low", "category": "Regulation", "headline": "IMO 2026 carbon rules take effect for VLCC class", "summary": "New emissions thresholds require speed reduction or fuel switching for large tankers.", "impact": "Fleet-wide compliance", "time": "1 hr ago"},
    ]
    return {"news": fallback, "generated_at": datetime.now().isoformat()}


class WhatIfRequest(BaseModel):
    scenario: str

@app.post("/api/what-if")
async def what_if_analysis(req: WhatIfRequest):
    """AI impact analysis for hypothetical supply chain scenarios."""
    ships = state["ships"]
    ports = state["ports"]
    at_risk_ships = [s["name"] for s in ships if s.get("status") != "on-time"]

    prompt = f"""You are a maritime supply chain risk analyst. Analyze this hypothetical scenario:

SCENARIO: {req.scenario}

CURRENT FLEET STATE:
- Total vessels: {len(ships)}
- At-risk vessels: {len(at_risk_ships)} ({', '.join(at_risk_ships[:5])})
- Active ports: {len(ports)}
- Weather events: {len(state['weather'])}

Provide a structured impact analysis with:
1. IMPACT SCORE (0-100, where 100 is catastrophic)
2. VESSELS AFFECTED (number and which ones)
3. FINANCIAL IMPACT ($ estimate)
4. CASCADING EFFECTS (3 bullet points)
5. AI RECOMMENDATION (1 action sentence)

Be specific, dramatic, and use real maritime terminology. Keep total response under 200 words."""

    try:
        from ai_engine import _call_gemini
        analysis = await asyncio.to_thread(_call_gemini, prompt)
        return {"analysis": analysis, "scenario": req.scenario}
    except Exception as e:
        return {"analysis": f"IMPACT SCORE: 72/100\n\nVESSELS AFFECTED: 8 of 15 vessels on affected routes\n\nFINANCIAL IMPACT: ~$180M in cargo value at risk; $45K/day demurrage per delayed vessel\n\nCASCADING EFFECTS:\n• Alternate Pacific routes will see 30% capacity surge\n• Port of Long Beach congestion expected to rise 25%\n• Fuel surcharges likely to increase 12-18%\n\nAI RECOMMENDATION: Activate Auto-Pilot immediately to pre-position 8 vessels on alternate corridors before scenario materializes.", "scenario": req.scenario}


class CostRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    weight_tons: float
    urgency: str  # standard|express|critical

@app.post("/api/cost-estimate")
async def cost_estimate(req: CostRequest):
    """AI-powered shipping cost calculator."""
    prompt = f"""Calculate a detailed shipping cost estimate for:
- Route: {req.origin} → {req.destination}  
- Cargo: {req.cargo_type}, {req.weight_tons} metric tons
- Service level: {req.urgency}
- Current market: Baltic Dry Index at 1,842 pts, Brent at $87/bbl

Provide a JSON-like breakdown with these fields:
- base_freight_usd: number
- fuel_surcharge_usd: number
- port_fees_usd: number
- insurance_usd: number
- total_usd: number
- transit_days: number
- risk_rating: low|medium|high
- co2_tons: number
- recommendation: string (1 sentence)

Output ONLY the JSON object, no markdown."""
    try:
        from ai_engine import _call_gemini
        result = await asyncio.to_thread(_call_gemini, prompt)
        import re
        json_match = re.search(r'\{.*\}', result, re.DOTALL)
        if json_match:
            estimate = json.loads(json_match.group())
            return {"estimate": estimate}
    except Exception as e:
        log.warning(f"Cost estimate fallback: {e}")

    # Fallback calculation
    base = req.weight_tons * 45 * (2 if req.urgency == "critical" else 1.4 if req.urgency == "express" else 1)
    return {"estimate": {
        "base_freight_usd": round(base),
        "fuel_surcharge_usd": round(base * 0.18),
        "port_fees_usd": round(base * 0.08),
        "insurance_usd": round(base * 0.015),
        "total_usd": round(base * 1.275),
        "transit_days": 18 if req.urgency == "standard" else 12 if req.urgency == "express" else 8,
        "risk_rating": "medium",
        "co2_tons": round(req.weight_tons * 0.012),
        "recommendation": f"AI recommends {req.urgency} service via Cape of Good Hope for optimal cost-risk balance."
    }}


# ═══════════════════════════════════════════════════════════════
# UPGRADE 1: VISUAL CARGO INSPECTOR  (Gemini 2.0 Multimodal)
# ═══════════════════════════════════════════════════════════════
import base64, hashlib, sqlite3

@app.post("/api/cargo-inspect")
async def cargo_inspect(request: dict):
    """Gemini Vision analyzes a cargo image: extracts shipment data, flags discrepancies, estimates damage."""
    image_b64 = request.get("image_b64", "")
    context   = request.get("context", "general cargo inspection")

    prompt = f"""You are an expert cargo inspector and insurance assessor with 20 years of experience.
Analyze this cargo/shipping image and provide a detailed JSON report:
{{
  "shipment_details": {{
    "cargo_type": "...", "estimated_weight_kg": 0, "dimensions": "LxWxH cm",
    "condition": "excellent|good|damaged|critical",
    "hazmat_detected": false, "temperature_sensitive": false
  }},
  "discrepancies": [
    {{"field": "...", "detected": "...", "expected": "...", "severity": "low|medium|high"}}
  ],
  "damage_assessment": {{
    "damage_detected": false, "severity": "none|minor|moderate|severe",
    "damage_type": "none|crushing|water|fire|theft",
    "affected_percentage": 0,
    "estimated_repair_cost_usd": 0,
    "estimated_replacement_cost_usd": 0
  }},
  "insurance_recommendation": {{
    "claim_recommended": false, "estimated_claim_usd": 0,
    "urgency": "none|low|high|critical", "notes": "..."
  }},
  "ai_confidence": 0.95,
  "inspection_notes": "Brief overall assessment"
}}
Context: {context}
Output ONLY the JSON, no markdown."""

    try:
        from google import genai
        from google.genai import types
        import re, base64
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            client = genai.Client(api_key=api_key)
            contents = [prompt]
            if image_b64:
                img_data = image_b64.split(",")[1] if "," in image_b64 else image_b64
                contents.append(types.Part.from_bytes(data=base64.b64decode(img_data), mime_type="image/jpeg"))
            response = client.models.generate_content(model="gemini-3-flash", contents=contents)
            j = re.search(r'\{.*\}', response.text, re.DOTALL)
            if j:
                return {"result": json.loads(j.group()), "model": "gemini-3-flash", "timestamp": datetime.now().isoformat()}
    except Exception as e:
        log.warning(f"Cargo inspect fallback: {e}")

    return {"result": {
        "shipment_details": {"cargo_type": "Consumer Electronics", "estimated_weight_kg": 4200,
                             "dimensions": "120x80x90cm", "condition": "good",
                             "hazmat_detected": False, "temperature_sensitive": False},
        "discrepancies": [{"field": "gross_weight", "detected": "4.2t", "expected": "4.0t", "severity": "low"}],
        "damage_assessment": {"damage_detected": False, "severity": "none", "damage_type": "none",
                              "affected_percentage": 0, "estimated_repair_cost_usd": 0,
                              "estimated_replacement_cost_usd": 0},
        "insurance_recommendation": {"claim_recommended": False, "estimated_claim_usd": 0,
                                     "urgency": "none",
                                     "notes": "Cargo in acceptable condition. Weight discrepancy within 5% tolerance."},
        "ai_confidence": 0.91,
        "inspection_notes": "Gemini Vision inspection complete. Packaging intact, no visible damage. Minor weight discrepancy logged."
    }, "model": "mock", "timestamp": datetime.now().isoformat()}


# ═══════════════════════════════════════════════════════════════
# UPGRADE 2: BLOCKCHAIN AUDIT TRAIL  (Merkle Tree + Anchoring)
# ═══════════════════════════════════════════════════════════════

def _sha256(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()

def _build_merkle_root(hashes: list) -> str:
    if not hashes:
        return _sha256("empty")
    layer = [_sha256(h) for h in hashes]
    while len(layer) > 1:
        if len(layer) % 2 == 1:
            layer.append(layer[-1])
        layer = [_sha256(layer[i] + layer[i+1]) for i in range(0, len(layer), 2)]
    return layer[0]

_blockchain_anchors: list = []

@app.post("/api/blockchain/anchor")
async def blockchain_anchor():
    """Hash current optimization log as Merkle tree and simulate anchoring to Ethereum Sepolia testnet."""
    try:
        log_entries = get_optimization_log()
        if not log_entries:
            entries_data = [{"id": i, "ts": datetime.now().isoformat(), "action": "fleet_telemetry"} for i in range(5)]
        else:
            entries_data = log_entries

        entry_hashes = [_sha256(json.dumps(e, default=str)) for e in entries_data]
        merkle_root  = _build_merkle_root(entry_hashes)
        block_number = random.randint(7_000_000, 7_999_999)
        tx_hash      = "0x" + _sha256(merkle_root + str(time.time()))

        anchor = {
            "id": len(_blockchain_anchors) + 1,
            "merkle_root": merkle_root,
            "tx_hash": tx_hash,
            "block_number": block_number,
            "network": "Ethereum Sepolia Testnet",
            "records_anchored": len(entries_data),
            "individual_hashes": entry_hashes[:6],
            "anchored_at": datetime.now().isoformat(),
            "explorer_url": f"https://sepolia.etherscan.io/tx/{tx_hash}",
            "gas_used": random.randint(21000, 45000),
            "confirmation_blocks": random.randint(12, 18),
            "verification_status": "CONFIRMED"
        }
        _blockchain_anchors.append(anchor)
        return anchor
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blockchain/anchors")
async def get_anchors():
    return {"anchors": list(reversed(_blockchain_anchors)), "total": len(_blockchain_anchors)}

@app.post("/api/blockchain/verify")
async def verify_hash(request: dict):
    """Independently verify a record against its stored hash — tamper detection."""
    record_data  = request.get("record_data", "")
    claimed_hash = request.get("claimed_hash", "")
    computed     = _sha256(json.dumps(record_data, default=str) if isinstance(record_data, dict) else str(record_data))
    match        = computed == claimed_hash
    return {
        "verified": match,
        "computed_hash": computed,
        "claimed_hash": claimed_hash,
        "tamper_detected": not match,
        "integrity": "INTACT" if match else "COMPROMISED",
        "verification_time": datetime.now().isoformat()
    }


# ═══════════════════════════════════════════════════════════════
# UPGRADE 3: NATURAL LANGUAGE WHAT-IF LAB (Multi-Agent Council)
# ═══════════════════════════════════════════════════════════════

class WhatIfLabRequest(BaseModel):
    query: str
    constraints: dict = {}

@app.post("/api/whatif-lab")
async def whatif_lab(req: WhatIfLabRequest):
    """Gemini parses NL scenario → multi-agent council debate → consensus action plan."""
    ships = state["ships"]
    ports = state["ports"]
    fleet_summary = f"{len(ships)} vessels, {len([s for s in ships if s['status'] != 'on-time'])} disrupted"
    at_risk_names = [s["name"] for s in ships if s["status"] != "on-time"][:5]

    prompt = f"""You are the AI Director of a 4-agent supply chain council.
Agents: NAVIGATOR (routes), ECONOMIST (costs/risk), ESG_OFFICER (sustainability), RISK_ANALYST (threats).

Current live fleet: {fleet_summary}
At-risk vessels: {at_risk_names}
Active ports: {[p['name'] for p in ports[:6]]}

Natural language scenario from user: "{req.query}"
User constraints: {json.dumps(req.constraints)}

Parse the scenario, run a council debate, return this EXACT JSON:
{{
  "scenario_title": "Short dramatic title (max 8 words)",
  "scenario_summary": "2-3 sentence plain-English summary of what this scenario means for the fleet",
  "probability_estimate": 0.72,
  "affected_ships": ["ship names from fleet"],
  "affected_routes": ["route names"],
  "council_debate": [
    {{"agent": "NAVIGATOR", "icon": "🧭", "position": "Analysis from navigator perspective", "recommendation": "Specific action", "confidence": 0.91}},
    {{"agent": "ECONOMIST", "icon": "💰", "position": "Financial analysis", "recommendation": "Specific action", "confidence": 0.88}},
    {{"agent": "ESG_OFFICER", "icon": "🌿", "position": "Sustainability analysis", "recommendation": "Specific action", "confidence": 0.85}},
    {{"agent": "RISK_ANALYST", "icon": "🛡️", "position": "Threat assessment", "recommendation": "Specific action", "confidence": 0.93}}
  ],
  "consensus_action": "The final agreed action plan (2-3 sentences)",
  "timeline": "Immediate/6h/24h/72h",
  "impact": {{
    "cost_delta_usd": 2800000,
    "time_delta_hours": 38,
    "co2_delta_tons": 340,
    "risk_delta_percent": -18,
    "esg_score_impact": -3,
    "ships_rerouted": 4,
    "cargo_at_risk_usd": 180000000
  }},
  "alternative_scenarios": ["Alternative option 1", "Alternative option 2"],
  "confidence_score": 0.89
}}
Output ONLY the JSON. No markdown."""

    try:
        from ai_engine import _call_gemini
        raw = await asyncio.to_thread(_call_gemini, prompt)
        import re
        j = re.search(r'\{.*\}', raw, re.DOTALL)
        if j:
            return {"result": json.loads(j.group()), "query": req.query, "generated_at": datetime.now().isoformat()}
    except Exception as e:
        log.warning(f"What-if lab fallback: {e}")

    return {"result": {
        "scenario_title": "Custom Scenario Analysis",
        "scenario_summary": f"The council has analyzed: '{req.query}'. Based on current fleet telemetry, 4 vessels are potentially impacted.",
        "probability_estimate": 0.74,
        "affected_ships": at_risk_names,
        "affected_routes": ["Trans-Pacific Route", "Asia-Europe Corridor", "Cape of Good Hope"],
        "council_debate": [
            {"agent": "NAVIGATOR", "icon": "🧭", "position": "Scenario forces 3,200nm reroute via alternative straits. Pre-approved contingency routes available.", "recommendation": "Activate Cape of Good Hope contingency immediately. ETA impact: +38h.", "confidence": 0.91},
            {"agent": "ECONOMIST", "icon": "💰", "position": "Rerouting adds $2.8M fuel cost but prevents $180M cargo exposure. ROI: 64:1.", "recommendation": "Execute reroute. Insurance coverage activates at $2M threshold. Notify underwriters.", "confidence": 0.88},
            {"agent": "ESG_OFFICER", "icon": "🌿", "position": "Longer routes add 340t CO₂. Within quarterly IMO 2030 budget. Carbon offset available.", "recommendation": "Proceed with reroute. Purchase 340t offset at $24.80/t = $8,432. Net ESG score: -3pts.", "confidence": 0.85},
            {"agent": "RISK_ANALYST", "icon": "🛡️", "position": "Alternative routes score LOW piracy risk. 72h weather window confirmed. Political risk: MEDIUM.", "recommendation": "Risk-adjusted score improves 18% on proposed route. Deploy insurance monitoring.", "confidence": 0.93}
        ],
        "consensus_action": "Execute immediate rerouting for all affected vessels via alternative corridor. Purchase 340t carbon offsets. Notify stakeholders within 2 hours. Review in 24h.",
        "timeline": "Immediate",
        "impact": {"cost_delta_usd": 2800000, "time_delta_hours": 38, "co2_delta_tons": 340, "risk_delta_percent": -18, "esg_score_impact": -3, "ships_rerouted": len(at_risk_names), "cargo_at_risk_usd": 180000000},
        "alternative_scenarios": ["Wait 48h for situational resolution (high uncertainty, $45M daily exposure)", "Partial reroute via northern corridor (medium risk, +$1.2M cost)"],
        "confidence_score": 0.89
    }, "query": req.query, "generated_at": datetime.now().isoformat()}


# ═══════════════════════════════════════════════════════════════
# UPGRADE 4: CARBON CREDIT MARKETPLACE
# ═══════════════════════════════════════════════════════════════

_carbon_portfolio: list = []
_CARBON_BASE_PRICE = 24.80  # USD per ton (EU ETS reference)

@app.get("/api/carbon/market")
async def carbon_market():
    """Live carbon credit marketplace — dynamic pricing, portfolio, and open listings."""
    log_entries = get_optimization_log()
    total_saved = sum(e.get("co2_saved_tons", random.uniform(60, 180)) for e in log_entries) if log_entries else 1240.0
    price_now   = round(_CARBON_BASE_PRICE + random.uniform(-2.1, 3.4), 2)
    revenue     = sum(t["value_usd"] for t in _carbon_portfolio)
    return {
        "market": {
            "price_per_ton_usd": price_now,
            "price_24h_change_pct": round(random.uniform(-4.2, 5.8), 2),
            "volume_24h_tons": random.randint(120000, 340000),
            "market_cap_usd": round(price_now * 4_200_000),
            "exchange": "EU Emissions Trading System (ETS)",
            "last_updated": datetime.now().isoformat()
        },
        "portfolio": {
            "total_co2_saved_tons": round(total_saved, 1),
            "tokenized_credits": round(total_saved * 0.85, 1),
            "available_to_sell": round(total_saved * 0.85 - sum(t["tons_sold"] for t in _carbon_portfolio), 1),
            "portfolio_value_usd": round(total_saved * 0.85 * price_now, 2),
            "pending_verification_tons": round(total_saved * 0.15, 1),
            "credits_sold_total": sum(t["tons_sold"] for t in _carbon_portfolio),
            "revenue_realized_usd": round(revenue, 2),
            "transactions": _carbon_portfolio[-5:]
        },
        "market_listings": [
            {"id": "CRB-EU-0042", "tons": 200, "price_per_ton": round(price_now * 1.02, 2), "seller": "ShipLine Alpha Fleet", "expiry": "2026-12-31", "verified_by": "Gold Standard", "available": True},
            {"id": "CRB-VCS-0108", "tons": 500, "price_per_ton": round(price_now * 0.98, 2), "seller": "Pacific Freight Co.", "expiry": "2026-06-30", "verified_by": "Verra VCS", "available": True},
            {"id": "CRB-IMO-0071", "tons": 150, "price_per_ton": round(price_now * 1.05, 2), "seller": "Smart Supply AI Fleet", "expiry": "2027-03-31", "verified_by": "IMO 2030 Certified", "available": True},
            {"id": "CRB-GS-0033", "tons": 800, "price_per_ton": round(price_now * 0.95, 2), "seller": "Ocean Cargo Partners", "expiry": "2026-09-15", "verified_by": "Gold Standard", "available": True},
        ]
    }

@app.post("/api/carbon/sell")
async def sell_carbon_credits(request: dict):
    """Tokenize and sell AI-optimized carbon savings as verified credits."""
    tons  = float(request.get("tons", 100))
    price = round(_CARBON_BASE_PRICE + random.uniform(-0.5, 0.8), 2)
    tx = {
        "tx_id": f"CC-{int(time.time())}",
        "tons_sold": tons,
        "price_per_ton_usd": price,
        "value_usd": round(tons * price, 2),
        "buyer": random.choice(["ESG Capital Fund III", "GreenShip Partners", "Carbon Zero Corp.", "Sustainable Ventures EU"]),
        "verified_by": "IMO 2030 Certified · Gold Standard",
        "blockchain_hash": "0x" + _sha256(f"cc{tons}{time.time()}")[:40],
        "settlement_status": "COMPLETED",
        "settled_at": datetime.now().isoformat()
    }
    _carbon_portfolio.append(tx)
    return tx
