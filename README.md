# 🌐 Smart Supply Chain AI
### Industrial-Grade AI Supply Chain Disruption Detector & Optimizer
> Built for **Google H2S Hackathon 2026** · Powered by **Gemini 2.0 Flash**

---

## 🎯 What It Does

Modern global supply chains manage millions of shipments across volatile networks. **Disruptions are only discovered after delays have already occurred.**

Smart Supply Chain AI uses **Gemini 2.0 Flash** with **Function Calling**, **Vision API**, and an **Agentic Auto-Pilot** to preemptively detect, analyze, and resolve disruptions — before they cascade into billion-dollar losses.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🌍 **3D Globe Visualization** | WebGL globe with animated ship arcs, port dots, storm zones |
| 🤖 **Gemini Function Calling** | AI autonomously calls fleet/port data tools to answer queries |
| 🛸 **Agentic Auto-Pilot** | Gemini reroutes at-risk ships without any human intervention |
| 📡 **WebSocket Real-Time** | Zero-latency live data push to all connected clients |
| 👁️ **Vision API Analysis** | Upload satellite images → AI detects weather anomalies |
| 💰 **Dollar Savings Dashboard** | Quantifies delay costs avoided, carbon credits, cargo protected |
| 📊 **Analytics Charts** | Time-series fleet status, CO₂ trends, port utilization |
| 🚢 **Fleet Management Table** | Sortable 15-vessel table with risk scores and click-to-detail |
| 🏗️ **Architecture Diagram** | Animated multi-agent pipeline visualization |
| 🎬 **Demo Mode** | One-click auto-play of full AI workflow (perfect for video) |
| 💬 **RAG Chat Widget** | Ask questions about live fleet data in natural language |
| 🌱 **CO₂ Tracking** | Real-time sustainability metrics with carbon credit valuation |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    USER BROWSER                       │
│         Next.js 16 · 3D Globe · Chart.js              │
└───────────────────┬──────────────────────────────────┘
                    │ WebSocket + REST
┌───────────────────▼──────────────────────────────────┐
│              FASTAPI BACKEND (Python)                  │
│   WebSocket Manager · SQLite · Simulation Engine      │
└───────────┬────────────────────────┬─────────────────┘
            │                        │
┌───────────▼──────────┐  ┌──────────▼─────────────────┐
│   GEMINI 2.0 FLASH   │  │     MULTI-AGENT SYSTEM      │
│   Function Calling   │  │  Weather · Risk · Route ·   │
│   Vision API         │  │  Sustainability Agents       │
│   Executive Summary  │  └────────────────────────────┘
└──────────────────────┘
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 20+
- A [Gemini API Key](https://aistudio.google.com/app/apikey)

### Backend
```bash
cd smart-supply-chain/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Add your API key
echo 'GEMINI_API_KEY="your_key_here"' > .env

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd smart-supply-chain/frontend
npm install
npm run dev
```

Open **http://localhost:3000** 🎉

---

## ☁️ Deploy to Google Cloud Run

```bash
# Backend
cd backend
gcloud run deploy smart-supply-backend \
  --source . --region us-central1 --allow-unauthenticated \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"

# Frontend (replace URL with your backend URL)
cd ../frontend
gcloud run deploy smart-supply-frontend \
  --source . --region us-central1 --allow-unauthenticated \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL/api"
```

---

## 🛠️ Tech Stack

**AI / ML**
- Gemini 2.0 Flash (Function Calling, Vision, Chat)
- Agentic Auto-Pilot with multi-agent orchestration

**Backend**
- FastAPI · Python 3.11 · WebSocket · SQLite · Pydantic v2

**Frontend**
- Next.js 16 (App Router) · react-globe.gl · Chart.js · Framer Motion · Tailwind CSS

**DevOps**
- Docker · Docker Compose · Google Cloud Run · GitHub CI/CD

---

## 📁 Project Structure

```
smart-supply-chain/
├── backend/
│   ├── main.py          # FastAPI server + WebSocket
│   ├── ai_engine.py     # Gemini Function Calling + Vision
│   ├── models.py        # Pydantic v2 data models
│   ├── database.py      # SQLite persistence layer
│   └── mock_data.json   # 15 ships, 12 ports, 5 weather events
└── frontend/
    ├── app/
    │   ├── page.tsx           # Dashboard (3D Globe)
    │   ├── fleet/page.tsx     # Fleet Management Table
    │   ├── analytics/page.tsx # Charts & Analytics
    │   └── architecture/page.tsx # AI Architecture Diagram
    └── components/
        ├── GlobeMap.tsx       # 3D WebGL Globe
        ├── DemoMode.tsx       # Guided Demo Player
        ├── SavingsPanel.tsx   # Economic Impact
        ├── ChatWidget.tsx     # Gemini RAG Chat
        └── AlertsPanel.tsx    # Disruption Alerts
```

---

## 🎬 Video Demo

> **3-Minute Walkthrough:**
> 1. Spinning 3D globe with 15 live vessels
> 2. Press Demo Mode — watch full AI workflow auto-play
> 3. Dollar savings panel — real business impact
> 4. Chat with Gemini about live fleet data
> 5. Analytics charts updating in real-time
> 6. Architecture diagram — multi-agent system

---

## 🌱 Sustainability Impact

Every AI-optimized reroute saves:
- **80–350 metric tons of CO₂** (avoided slow steaming through storms)
- **$45,000+ in demurrage costs** per day of delay avoided
- **$65/ton in carbon credits** on the voluntary carbon market

---

## 👤 Author

**Kiran Biradar** · [GitHub](https://github.com/kirancodes-dev) · Google H2S Hackathon 2026
