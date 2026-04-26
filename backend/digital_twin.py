import random
import time
from typing import Dict, List, Any

class GenerativeDigitalTwin:
    def __init__(self):
        self.state = {
            "ships": [],
            "ports": [],
            "weather": [],
            "alerts": [],
            "total_co2_saved_tons": 0,
            "agent_auto_pilot": False,
            "total_alerts_resolved": 0,
            "tick": 0
        }
        self.initialize_world()

    def initialize_world(self):
        # Generate dynamic baseline state instead of loading static mock_data.json
        self.state["ports"] = [
            {"id": "P-LAX", "name": "Los Angeles", "lat": 33.72, "lng": -118.26, "capacity": 200, "current_load": random.randint(120, 190), "status": "Moderate"},
            {"id": "P-NYC", "name": "New York", "lat": 40.71, "lng": -74.00, "capacity": 180, "current_load": random.randint(100, 175), "status": "Moderate"},
            {"id": "P-ROT", "name": "Rotterdam", "lat": 51.92, "lng": 4.47, "capacity": 250, "current_load": random.randint(180, 240), "status": "Congested"},
            {"id": "P-SHA", "name": "Shanghai", "lat": 31.23, "lng": 121.47, "capacity": 300, "current_load": random.randint(200, 290), "status": "Congested"},
            {"id": "P-SIN", "name": "Singapore", "lat": 1.35, "lng": 103.81, "capacity": 280, "current_load": random.randint(150, 260), "status": "Moderate"},
            {"id": "P-SEA", "name": "Seattle", "lat": 47.60, "lng": -122.33, "capacity": 120, "current_load": random.randint(50, 110), "status": "Clear"},
            {"id": "P-MIA", "name": "Miami", "lat": 25.76, "lng": -80.19, "capacity": 140, "current_load": random.randint(80, 130), "status": "Moderate"},
            {"id": "P-HOU", "name": "Houston", "lat": 29.76, "lng": -95.36, "capacity": 160, "current_load": random.randint(90, 150), "status": "Moderate"},
            {"id": "P-HBG", "name": "Hamburg", "lat": 53.55, "lng": 9.99, "capacity": 190, "current_load": random.randint(110, 185), "status": "Moderate"},
            {"id": "P-GEN", "name": "Genoa", "lat": 44.40, "lng": 8.94, "capacity": 100, "current_load": random.randint(40, 95), "status": "Clear"},
        ]

        ships = [
            ("Oceanic Pioneer", "Container Ship", 48000000),
            ("Global Trader", "Bulk Carrier", 31000000),
            ("Pacific Voyager", "Container Ship", 12000000),
            ("Atlantic Breeze", "Ro-Ro Vessel", 27000000),
            ("Northern Star", "Tanker", 55000000),
            ("Silk Road Express", "Container Ship", 22000000),
            ("Amazon Carrier", "Bulk Carrier", 9000000),
            ("Indian Ocean Gate", "Container Ship", 65000000),
            ("Dragon Pearl", "Container Ship", 88000000),
            ("Sahara Wind", "Bulk Carrier", 7000000),
            ("Sunrise Maru", "Ro-Ro Vessel", 42000000),
            ("Arctic Pioneer", "Bulk Carrier", 5000000),
            ("Cape Hope", "Bulk Carrier", 18000000),
            ("Liberty Bell", "Bulk Carrier", 11000000),
            ("Coral Princess", "LNG Tanker", 120000000)
        ]

        for i, (name, vtype, val) in enumerate(ships):
            p1, p2 = random.sample(self.state["ports"], 2)
            self.state["ships"].append({
                "id": f"SH-00{i+1}" if i < 9 else f"SH-0{i+1}",
                "name": name,
                "origin": p1["name"],
                "destination": p2["id"],
                "lat": p1["lat"] + random.uniform(-10, 10),
                "lng": p1["lng"] + random.uniform(-10, 10),
                "status": "on-time",
                "eta": f"2026-05-{random.randint(1, 28):02d}",
                "cargo": "Mixed Commercial",
                "cargo_value_usd": val,
                "company": "Global Logistics Corp",
                "flag": "Panama",
                "vessel_type": vtype,
                "speed_knots": random.randint(14, 22),
                "delay_hours": 0
            })

        self.state["weather"] = [
            {"id": "W-001", "type": "Typhoon", "severity": "High", "lat": 18.0, "lng": 135.0, "radius_km": 600, "status": "Active"},
            {"id": "W-002", "type": "Hurricane", "severity": "Critical", "lat": 26.0, "lng": -75.0, "radius_km": 450, "status": "Active"},
            {"id": "W-003", "type": "Winter Storm", "severity": "Medium", "lat": 50.0, "lng": -30.0, "radius_km": 800, "status": "Active"}
        ]

    def tick_simulation(self):
        """Advances the digital twin state by one unit of time"""
        self.state["tick"] += 1
        
        # Micro-variations for digital twin fidelity
        for ship in self.state["ships"]:
            if ship["status"] != "rerouted":
                ship["lng"] += random.uniform(-0.5, 0.5)
                ship["lat"] += random.uniform(-0.4, 0.4)
                ship["lng"] = max(-179, min(179, ship["lng"]))
                ship["lat"] = max(-80, min(80, ship["lat"]))

        for port in self.state["ports"]:
            delta = random.randint(-5, 5)
            port["current_load"] = max(0, min(port["capacity"], port["current_load"] + delta))
            util = port["current_load"] / port["capacity"]
            if util > 0.90: port["status"] = "Congested"
            elif util > 0.70: port["status"] = "Moderate"
            else: port["status"] = "Clear"
            
        return self.state

# Singleton instance
digital_twin = GenerativeDigitalTwin()
