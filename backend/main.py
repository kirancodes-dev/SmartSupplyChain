import asyncio
import json
import os
import random
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ai_engine import analyze_disruptions, optimize_route, chat_with_supply_chain, analyze_visual_anomaly

app = FastAPI(title="Smart Supply Chain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

state = {
    "ships": [],
    "ports": [],
    "weather": [],
    "alerts": [],
    "total_co2_saved_tons": 0,
    "agent_auto_pilot": False
}

def load_initial_data():
    global state
    with open("mock_data.json", "r") as f:
        data = json.load(f)
        state["ships"] = data.get("ships", [])
        state["ports"] = data.get("ports", [])
        state["weather"] = data.get("weather", [])

load_initial_data()

async def simulate_world():
    global state
    while True:
        await asyncio.sleep(5)
        for ship in state["ships"]:
            if ship["status"] != "rerouted":
                ship["lng"] += random.uniform(-0.5, 0.5)
                ship["lat"] += random.uniform(-0.5, 0.5)
            
            if ship["status"] != "rerouted":
                ship["status"] = "on-time"
            for w in state["weather"]:
                dist = ((ship["lat"] - w["lat"])**2 + (ship["lng"] - w["lng"])**2)**0.5
                if dist < 15 and ship["status"] != "rerouted":
                    ship["status"] = "at-risk"
                    
        for port in state["ports"]:
            port["current_load"] = max(0, min(port["capacity"], port["current_load"] + random.randint(-5, 5)))
            if port["current_load"] > port["capacity"] * 0.9:
                port["status"] = "Congested"
            elif port["current_load"] > port["capacity"] * 0.7:
                port["status"] = "Moderate"
            else:
                port["status"] = "Clear"
                
        if random.random() > 0.6:
            new_alerts = analyze_disruptions(state)
            for na in new_alerts:
                if not any(a["id"] == na["id"] for a in state["alerts"]):
                    # Agentic Auto-Pilot Mode handling
                    if state["agent_auto_pilot"] and na.get("actionable") and na.get("ship_id"):
                        ship = next((s for s in state["ships"] if s["id"] == na["ship_id"]), None)
                        if ship:
                            rec = optimize_route(ship, state)
                            if rec and rec.get("new_destination"):
                                ship["destination"] = rec["new_destination"]
                                ship["status"] = "rerouted"
                                state["total_co2_saved_tons"] += rec.get("co2_saved_tons", random.randint(50, 150))
                                na["message"] = f"[AUTO-PILOT HANDLED] {na['message']} AI automatically rerouted ship to {rec.get('new_destination_name', rec['new_destination'])}."
                                na["actionable"] = False # Action already taken
                    
                    state["alerts"].insert(0, na)

            state["alerts"] = state["alerts"][:15]

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulate_world())

@app.get("/api/state")
def get_state():
    return state

@app.get("/api/alerts")
def get_alerts():
    return state["alerts"]

class OptimizeRequest(BaseModel):
    ship_id: str

@app.post("/api/optimize")
def request_optimization(req: OptimizeRequest):
    ship = next((s for s in state["ships"] if s["id"] == req.ship_id), None)
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
        
    recommendation = optimize_route(ship, state)
    
    if recommendation and recommendation.get("new_destination"):
        ship["destination"] = recommendation["new_destination"]
        ship["status"] = "rerouted"
        state["total_co2_saved_tons"] += recommendation.get("co2_saved_tons", random.randint(50, 150))
        
        # update the alert locally to not actionable
        for a in state["alerts"]:
            if a.get("ship_id") == req.ship_id:
                a["actionable"] = False
        
    return {"status": "success", "recommendation": recommendation}

@app.post("/api/toggle-autopilot")
def toggle_autopilot():
    state["agent_auto_pilot"] = not state["agent_auto_pilot"]
    return {"agent_auto_pilot": state["agent_auto_pilot"]}

class ChatRequest(BaseModel):
    query: str

@app.post("/api/chat")
def api_chat(req: ChatRequest):
    reply = chat_with_supply_chain(state, req.query)
    return {"reply": reply}

class VisionRequest(BaseModel):
    image_base64: str

@app.post("/api/analyze-vision")
def api_analyze_vision(req: VisionRequest):
    alert = analyze_visual_anomaly(req.image_base64)
    if alert:
        state["alerts"].insert(0, alert)
    return {"status": "success", "alert": alert}
