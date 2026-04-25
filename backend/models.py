from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class ShipStatus(str, Enum):
    ON_TIME = "on-time"
    AT_RISK = "at-risk"
    DELAYED = "delayed"
    REROUTED = "rerouted"

class PortStatus(str, Enum):
    CLEAR = "Clear"
    MODERATE = "Moderate"
    CONGESTED = "Congested"

class AlertSeverity(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Ship(BaseModel):
    id: str
    name: str
    origin: str
    destination: str
    lat: float
    lng: float
    status: ShipStatus = ShipStatus.ON_TIME
    eta: str
    cargo: str
    cargo_value_usd: int = 0
    company: str = ""
    flag: str = ""
    vessel_type: str = "Container Ship"
    speed_knots: float = 18.0
    delay_hours: float = 0.0
    risk_score: int = 0

class Port(BaseModel):
    id: str
    name: str
    full_name: str = ""
    lat: float
    lng: float
    capacity: int
    current_load: int
    status: PortStatus = PortStatus.CLEAR
    country: str = ""
    region: str = ""

class WeatherEvent(BaseModel):
    id: str
    type: str
    name: str
    lat: float
    lng: float
    radius_km: float
    severity: AlertSeverity
    wind_speed_knots: float = 0.0

class Alert(BaseModel):
    id: str
    type: str
    severity: AlertSeverity
    message: str
    related_entity: Optional[str] = None
    actionable: bool = False
    ship_id: Optional[str] = None
    timestamp: Optional[str] = None

class OptimizeRequest(BaseModel):
    ship_id: str

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)

class VisionRequest(BaseModel):
    image_base64: str = Field(..., min_length=10)

class SystemMetrics(BaseModel):
    total_ships: int
    at_risk_count: int
    rerouted_count: int
    delayed_count: int
    on_time_count: int
    congested_ports: int
    total_co2_saved_tons: int
    total_alerts_resolved: int
    agent_auto_pilot: bool
    uptime_seconds: float

class WeatherInjectRequest(BaseModel):
    type: str = "Typhoon"
    name: str = "Custom Storm"
    lat: float
    lng: float
    radius_km: float = 400.0
    severity: str = "High"
    wind_speed_knots: float = 120.0
