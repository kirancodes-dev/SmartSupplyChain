# Smart Supply Chain

This is a hackathon project for a Smart Supply Chain application.

## Structure

- **`frontend/`**: Next.js UI (Dashboard)
  - `app/`: Main web pages
  - `components/`: Reusable UI (Map, KPIs, Alert Cards)
  - `lib/`: API clients to fetch backend data
- **`backend/`**: Python FastAPI server
  - `main.py`: API routes and endpoints
  - `ai_engine.py`: Gemini API integration for dynamic route optimization
  - `mock_data.json`: Simulated port, weather, and transit data
- **`.gaai/`**: Antigravity specific folder for agent instructions

## Instructions for the hackathon judges

1. Navigate to the `frontend` directory and run `npm run dev` to start the UI dashboard.
2. Navigate to the `backend` directory and run `uvicorn main:app --reload` to start the API server.
