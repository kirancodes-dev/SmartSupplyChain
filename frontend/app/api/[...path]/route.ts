import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

type Params = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, pathParts: string[], method: string): Promise<NextResponse> {
  const url = `${BACKEND}/api/${pathParts.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  const init: RequestInit = { method, headers, cache: "no-store" };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path, "GET");
}

export async function POST(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path, "POST");
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { path } = await params;
  return proxy(req, path, "DELETE");
}
