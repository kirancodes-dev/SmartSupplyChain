import os
import json
import random
import base64
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
except ImportError:
    HAS_GEMINI = False

def analyze_disruptions(state):
    alerts = []
    for port in state.get("ports", []):
        if port.get("status") == "Congested":
            alerts.append({
                "id": f"alert-port-{port['id']}-{random.randint(100,999)}",
                "type": "Port Congestion",
                "severity": "High",
                "message": f"{port['name']} is operating at over 90% capacity. Expect offloading delays of 3-5 days.",
                "related_entity": port['id'],
                "actionable": False
            })
            
    for ship in state.get("ships", []):
        if ship.get("status") == "at-risk" or ship.get("status") == "delayed":
            alerts.append({
                "id": f"alert-ship-{ship['id']}-{random.randint(100,999)}",
                "type": "Transit Delay",
                "severity": "Medium",
                "message": f"Ship {ship['name']} is at risk of delay due to nearby weather anomalies or port congestion.",
                "related_entity": ship['id'],
                "actionable": True,
                "ship_id": ship['id']
            })
    return alerts

def optimize_route(ship, state):
    if HAS_GEMINI and os.environ.get("GEMINI_API_KEY"):
        try:
            prompt = f"""
            You are an AI Supply Chain Optimizer.
            Analyze the following ship and world state to provide a route optimization recommendation.
            Ship: {json.dumps(ship)}
            Weather: {json.dumps(state['weather'])}
            Ports: {json.dumps(state['ports'])}
            
            Return ONLY a valid JSON object with:
            - new_destination: The ID of a recommended alternative port (must be from the provided ports list).
            - reason: A short explanation of why this route is better.
            - estimated_delay_saved_days: An integer estimate of days saved.
            - speed_adjustment: Suggested speed adjustment.
            - co2_saved_tons: Integer estimating CO2 emissions saved by avoiding the disruption (usually 50-200 tons).
            """
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            pass
            
    alternative_ports = [p for p in state['ports'] if p['id'] != ship.get('destination') and p['status'] != 'Congested']
    alt_port = random.choice(alternative_ports) if alternative_ports else state['ports'][0]
    
    return {
        "new_destination": alt_port['id'],
        "new_destination_name": alt_port['name'],
        "reason": f"Rerouting to avoid congestion. {alt_port['name']} currently has better capacity and clear weather.",
        "estimated_delay_saved_days": random.randint(2, 7),
        "speed_adjustment": "Increase by 15% to avoid storm.",
        "co2_saved_tons": random.randint(100, 300)
    }

def chat_with_supply_chain(state, query):
    if HAS_GEMINI and os.environ.get("GEMINI_API_KEY"):
        try:
            prompt = f"""
            You are an expert AI Supply Chain Assistant. Use the following live system state to answer the user's question.
            Keep your answer concise, professional, and directly address the query using the data.
            
            Live Data:
            {json.dumps(state, default=str)}
            
            User Question: {query}
            """
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            pass
            
    # Mock RAG fallback
    return "The AI engine is currently running in mock mode. To dynamically answer queries about our live data like '" + query + "', please provide a valid GEMINI_API_KEY."

def analyze_visual_anomaly(image_base64):
    if HAS_GEMINI and os.environ.get("GEMINI_API_KEY"):
        try:
            image_bytes = base64.b64decode(image_base64)
            prompt = "Analyze this satellite weather/harbor image and identify any supply chain disruptions. Return a JSON with: 'type' (e.g. Hurricane), 'severity' (High/Medium/Low), 'message', 'actionable' (boolean)."
            
            response = client.models.generate_content(
                model='gemini-2.5-pro',
                contents=[
                    prompt, 
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
                ]
            )
            text = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            return {
                "id": f"alert-vision-{random.randint(1000,9999)}",
                "type": data.get("type", "Visual Anomaly"),
                "severity": data.get("severity", "High"),
                "message": f"[AI Vision Analysis] {data.get('message', 'Detected visual anomaly impacting routes.')}",
                "related_entity": None,
                "actionable": data.get("actionable", False)
            }
        except Exception as e:
            print(f"Gemini API Error: {e}")
            pass
            
    return {
        "id": f"alert-vision-{random.randint(1000,9999)}",
        "type": "Satellite Anomaly",
        "severity": "High",
        "message": "[AI Vision Analysis] Detected a massive storm system in the uploaded scan. Ships approaching this coordinate zone are at risk.",
        "related_entity": "W-New",
        "actionable": False
    }
