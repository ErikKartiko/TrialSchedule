import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classSchedules, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { dayNameToIndex } from "@/lib/class-schedule-utils";
import { addDays, addWeeks, addYears } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await db
      .select()
      .from(classSchedules)
      .where(
        and(
          eq(classSchedules.id, id),
          eq(classSchedules.userId, session.userId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    }

    const sched = result[0];

    // Find the next occurrence of this day of week starting from today
    const targetDow = dayNameToIndex(sched.day);
    const today = new Date();
    let nextDate = new Date(today);
    for (let i = 0; i < 7; i++) {
      if (nextDate.getDay() === targetDow) break;
      nextDate = addDays(nextDate, 1);
    }

    const [startH, startM] = sched.startTime.split(":").map(Number);
    const [endH, endM] = sched.endTime.split(":").map(Number);

    const startTime = new Date(nextDate);
    startTime.setHours(startH || 0, startM || 0, 0, 0);
    const endTime = new Date(nextDate);
    endTime.setHours(endH || 0, endM || 0, 0, 0);

    const recurrenceEnd = addYears(startTime, 1);

    const title = `${sched.courseCode ? sched.courseCode + " - " : ""}${sched.courseName}${sched.className ? " (Kelas " + sched.className + ")" : ""}`;

    const created = await db
      .insert(events)
      .values({
        userId: session.userId,
        title,
        description: sched.teachers.length
          ? `Pengajar: ${sched.teachers.join(", ")}`
          : null,
        location: sched.room || null,
        category: "teaching",
        startTime,
        endTime,
        recurrence: "weekly",
        recurrenceEnd,
        status: "scheduled",
        reminderMinutes: 15,
        color: "#3B82F6",
      })
      .returning();

    return NextResponse.json({ event: created[0] });
  } catch (error) {
    console.error("Add to calendar error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
