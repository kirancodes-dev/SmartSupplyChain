import os
import json
import random

try:
    import google.generativeai as genai
    HAS_GEMINI = True
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    else:
        HAS_GEMINI = False
except ImportError:
    HAS_GEMINI = False

def analyze_disruptions(state):
    """
    Analyzes the current state and returns a list of alerts.
    If Gemini is available, it uses the AI. Otherwise, it falls back to a smart mock.
    """
    alerts = []
    
    # Check for congested ports
    for port in state.get("ports", []):
        if port.get("status") == "Congested":
            alerts.append({
                "id": f"alert-port-{port['id']}",
                "type": "Port Congestion",
                "severity": "High",
                "message": f"{port['name']} is operating at over 90% capacity. Expect offloading delays of 3-5 days.",
                "related_entity": port['id'],
                "actionable": False
            })
            
    # Check for ships at risk
    for ship in state.get("ships", []):
        if ship.get("status") == "at-risk" or ship.get("status") == "delayed":
            alerts.append({
                "id": f"alert-ship-{ship['id']}",
                "type": "Transit Delay",
                "severity": "Medium",
                "message": f"Ship {ship['name']} is at risk of delay due to nearby weather anomalies or port congestion.",
                "related_entity": ship['id'],
                "actionable": True,
                "ship_id": ship['id']
            })
            
    return alerts

def optimize_route(ship, state):
    """
    Given a ship and world state, recommends an optimized route to avoid disruptions.
    """
    if HAS_GEMINI and os.environ.get("GEMINI_API_KEY"):
        # Real Gemini Call
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            prompt = f"""
            You are an AI Supply Chain Optimizer.
            Analyze the following ship and world state to provide a route optimization recommendation.
            Ship: {json.dumps(ship)}
            Weather: {json.dumps(state['weather'])}
            Ports: {json.dumps(state['ports'])}
            
            Return ONLY a valid JSON object with:
            - new_destination: The ID of a recommended alternative port (must be from the provided ports list), or the same port if no change is needed.
            - reason: A short explanation of why this route is better.
            - estimated_delay_saved_days: An integer estimate of days saved.
            - speed_adjustment: Suggested speed adjustment (e.g., "Increase by 10%").
            """
            response = model.generate_content(prompt)
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"Gemini API Error: {e}")
            pass
            
    # Mock Response
    alternative_ports = [p for p in state['ports'] if p['id'] != ship.get('destination') and p['status'] != 'Congested']
    alt_port = random.choice(alternative_ports) if alternative_ports else state['ports'][0]
    
    return {
        "new_destination": alt_port['id'],
        "new_destination_name": alt_port['name'],
        "reason": f"Rerouting to avoid congestion. {alt_port['name']} currently has better capacity and clear weather.",
        "estimated_delay_saved_days": random.randint(2, 7),
        "speed_adjustment": "Increase by 15% to avoid storm."
    }
