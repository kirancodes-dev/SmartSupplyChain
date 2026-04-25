import asyncio
import json
import os
import random
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

from ai_engine import analyze_disruptions, optimize_route

app = FastAPI(title="Smart Supply Chain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory state
state = {
    "ships": [],
    "ports": [],
    "weather": [],
    "alerts": []
}

def load_initial_data():
    global state
    with open("mock_data.json", "r") as f:
        data = json.load(f)
        state["ships"] = data.get("ships", [])
        state["ports"] = data.get("ports", [])
        state["weather"] = data.get("weather", [])

load_initial_data()

# Simulation loop
async def simulate_world():
    global state
    while True:
        await asyncio.sleep(5) # Update every 5 seconds
        # Move ships slightly towards destinations (mock movement)
        for ship in state["ships"]:
            ship["lng"] += random.uniform(-0.5, 0.5)
            ship["lat"] += random.uniform(-0.5, 0.5)
            
            # Simple risk calculation based on weather proximity
            ship["status"] = "on-time"
            for w in state["weather"]:
                dist = ((ship["lat"] - w["lat"])**2 + (ship["lng"] - w["lng"])**2)**0.5
                if dist < 15: # mock distance
                    ship["status"] = "at-risk"
                    
        # occasionally update port loads
        for port in state["ports"]:
            port["current_load"] = max(0, min(port["capacity"], port["current_load"] + random.randint(-5, 5)))
            if port["current_load"] > port["capacity"] * 0.9:
                port["status"] = "Congested"
            elif port["current_load"] > port["capacity"] * 0.7:
                port["status"] = "Moderate"
            else:
                port["status"] = "Clear"
                
        # Run AI analysis occasionally
        if random.random() > 0.6:
            new_alerts = analyze_disruptions(state)
            # Add only unique alerts
            for na in new_alerts:
                if not any(a["id"] == na["id"] for a in state["alerts"]):
                    state["alerts"].insert(0, na)
            state["alerts"] = state["alerts"][:15] # keep latest 15

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
    
    # Apply recommendation
    if recommendation and recommendation.get("new_destination"):
        ship["destination"] = recommendation["new_destination"]
        ship["status"] = "rerouted"
        
    return {"status": "success", "recommendation": recommendation}
