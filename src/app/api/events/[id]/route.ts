import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await db
      .update(events)
      .set({
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
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, id), eq(events.userId, session.userId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: updated[0] });
  } catch (error) {
    console.error("Event PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, session.userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Event DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
