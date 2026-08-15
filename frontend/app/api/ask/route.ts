import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, history } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Query cannot be empty" },
        { status: 400 }
      );
    }

    const backendRes = await fetch("http://127.0.0.1:8000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, history: history || [] }),
    });

    if (!backendRes.ok) {
      throw new Error(`Backend error: ${backendRes.status}`);
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("shlokaAI API error:", err);
    return NextResponse.json(
      { error: "Could not reach the shlokaAI backend. Is it running?" },
      { status: 500 }
    );
  }
}
