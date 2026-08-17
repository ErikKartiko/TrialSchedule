import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    let query = db.select().from(events).where(eq(events.userId, session.userId)).$dynamic();

    const conditions = [eq(events.userId, session.userId)];

    if (start) conditions.push(gte(events.startTime, new Date(start)));
    if (end) conditions.push(lte(events.startTime, new Date(end)));
    if (status && status !== "all") conditions.push(eq(events.status, status as "scheduled" | "completed" | "cancelled"));
    if (category && category !== "all") conditions.push(eq(events.category, category as "teaching" | "course" | "meeting" | "mentoring" | "research" | "other"));

    const result = await db.select().from(events).where(and(...conditions));

    return NextResponse.json({ events: result });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
