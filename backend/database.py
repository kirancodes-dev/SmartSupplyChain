import sqlite3
import json
import time
from datetime import datetime
from typing import List, Dict, Any

DB_PATH = "supply_chain.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS simulation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            at_risk_count INTEGER,
            on_time_count INTEGER,
            delayed_count INTEGER,
            rerouted_count INTEGER,
            congested_ports INTEGER,
            co2_saved INTEGER,
            active_alerts INTEGER
        )
    """)
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS resolved_alerts (
            id TEXT PRIMARY KEY,
            type TEXT,
            severity TEXT,
            message TEXT,
            ship_id TEXT,
            resolved_at TEXT,
            resolution TEXT
        )
    """)
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS optimization_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ship_id TEXT,
            ship_name TEXT,
            old_destination TEXT,
            new_destination TEXT,
            co2_saved INTEGER,
            reason TEXT,
            timestamp TEXT,
            auto_pilot INTEGER DEFAULT 0
        )
    """)
    
    conn.commit()
    conn.close()

def save_history_tick(state: Dict[str, Any]):
    conn = get_conn()
    c = conn.cursor()
    ships = state.get("ships", [])
    ports = state.get("ports", [])
    alerts = state.get("alerts", [])
    c.execute("""
        INSERT INTO simulation_history 
        (timestamp, at_risk_count, on_time_count, delayed_count, rerouted_count, congested_ports, co2_saved, active_alerts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        sum(1 for s in ships if s.get("status") == "at-risk"),
        sum(1 for s in ships if s.get("status") == "on-time"),
        sum(1 for s in ships if s.get("status") == "delayed"),
        sum(1 for s in ships if s.get("status") == "rerouted"),
        sum(1 for p in ports if p.get("status") == "Congested"),
        state.get("total_co2_saved_tons", 0),
        len(alerts)
    ))
    conn.commit()
    conn.close()

def get_history(limit: int = 60) -> List[Dict]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM simulation_history ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return list(reversed(rows))

def log_optimization(ship: Dict, new_dest: str, co2: int, reason: str, auto: bool):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO optimization_log (ship_id, ship_name, old_destination, new_destination, co2_saved, reason, timestamp, auto_pilot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ship.get("id"), ship.get("name"),
        ship.get("destination"), new_dest,
        co2, reason,
        datetime.utcnow().isoformat(),
        1 if auto else 0
    ))
    conn.commit()
    conn.close()

def get_optimization_log(limit: int = 20) -> List[Dict]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM optimization_log ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return rows

def get_total_optimizations() -> int:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as cnt FROM optimization_log")
    row = c.fetchone()
    conn.close()
    return row["cnt"] if row else 0
