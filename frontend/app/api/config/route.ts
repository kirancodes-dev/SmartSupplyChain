import { NextResponse } from "next/server";

export function GET() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const wsUrl = backendUrl.replace("https://", "wss://").replace("http://", "ws://") + "/ws";
  return NextResponse.json({ wsUrl });
}
