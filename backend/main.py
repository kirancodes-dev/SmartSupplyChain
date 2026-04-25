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

from models import OptimizeRequest, ChatRequest, VisionRequest
from ai_engine import (
    analyze_disruptions, optimize_route,
    chat_with_supply_chain, analyze_visual_anomaly,
    generate_executive_summary, get_risk_score
)
from database import (
    init_db, save_history_tick, get_history,
    log_optimization, get_optimization_log, get_total_optimizations
)

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
state = {
    "ships": [],
    "ports": [],
    "weather": [],
    "alerts": [],
    "total_co2_saved_tons": 0,
    "agent_auto_pilot": False,
    "total_alerts_resolved": 0,
    "tick": 0
}

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
    with open("mock_data.json", "r") as f:
        data = json.load(f)
    state["ships"] = data.get("ships", [])
    state["ports"] = data.get("ports", [])
    state["weather"] = data.get("weather", [])
    log.info(f"Loaded {len(state['ships'])} ships, {len(state['ports'])} ports, {len(state['weather'])} weather events")

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

        # Broadcast to WebSocket clients
        if manager.active:
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

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "websocket_clients": len(manager.active),
        "ships_tracked": len(state["ships"]),
        "ports_monitored": len(state["ports"])
    }
