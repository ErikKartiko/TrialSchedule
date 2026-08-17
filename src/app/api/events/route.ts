import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getEventsForRange } from "@/lib/events";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const publicView = searchParams.get("public") === "true";

    // Get the first user for public view
    let userId: string;
    if (publicView) {
      const allUsers = await db.select().from(users).limit(1);
      if (allUsers.length === 0) {
        return NextResponse.json({ events: [] });
      }
      userId = allUsers[0].id;
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.userId;
    }

    if (start && end) {
      const result = await getEventsForRange(
        userId,
        new Date(start),
        new Date(end)
      );
      return NextResponse.json({ events: result });
    }

    const result = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));
    return NextResponse.json({ events: result });
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const newEvent = await db
      .insert(events)
      .values({
        userId: session.userId,
        title: body.title,
        description: body.description || null,
        location: body.location || null,
        category: body.category || "other",
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        recurrence: body.recurrence || "none",
        recurrenceEnd: body.recurrenceEnd ? new Date(body.recurrenceEnd) : null,
        status: body.status || "scheduled",
        reminderMinutes: body.reminderMinutes ?? 15,
        color: body.color || "#3B82F6",
      })
      .returning();

    return NextResponse.json({ event: newEvent[0] });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
