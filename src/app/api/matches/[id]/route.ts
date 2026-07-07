import { NextRequest, NextResponse } from "next/server";
import { fetchFixtureDetail } from "@/lib/api-football";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json(
      { error: "API_FOOTBALL_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const match = await fetchFixtureDetail(id);
    return NextResponse.json(match);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error(`[api/matches/${id}]`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
