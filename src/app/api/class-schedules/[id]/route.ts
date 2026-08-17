import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classSchedules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import {
  syncClassScheduleToCalendar,
  deleteEventForClassSchedule,
} from "@/lib/class-schedule-sync";

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

    // Get existing record first to check autoSync and syncedEventId
    const existing = await db
      .select()
      .from(classSchedules)
      .where(
        and(
          eq(classSchedules.id, id),
          eq(classSchedules.userId, session.userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await db
      .update(classSchedules)
      .set({
        day: body.day,
        startTime: body.startTime,
        endTime: body.endTime,
        courseCode: body.courseCode || null,
        courseName: body.courseName,
        className: body.className || null,
        room: body.room || null,
        teachers: Array.isArray(body.teachers) ? body.teachers : [],
        semester: body.semester || null,
        notes: body.notes || null,
        autoSync: body.autoSync !== false, // default true
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(classSchedules.id, id),
          eq(classSchedules.userId, session.userId)
        )
      )
      .returning();

    const updatedRecord = updated[0];

    // Sync changes to calendar if autoSync is enabled
    if (updatedRecord.autoSync) {
      try {
        await syncClassScheduleToCalendar(updatedRecord.id, {
          userId: session.userId,
          day: updatedRecord.day,
          startTime: updatedRecord.startTime,
          endTime: updatedRecord.endTime,
          courseCode: updatedRecord.courseCode,
          courseName: updatedRecord.courseName,
          className: updatedRecord.className,
          room: updatedRecord.room,
          teachers: updatedRecord.teachers,
          semester: updatedRecord.semester,
          notes: updatedRecord.notes,
        });
      } catch (error) {
        console.error("Error syncing to calendar:", error);
        // Don't fail the request
      }
    }

    return NextResponse.json({ schedule: updatedRecord });
  } catch (error) {
    console.error("Class schedule PUT error:", error);
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

    // Get existing record to check syncedEventId
    const existing = await db
      .select()
      .from(classSchedules)
      .where(
        and(
          eq(classSchedules.id, id),
          eq(classSchedules.userId, session.userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Delete synced event if exists
    if (existing[0].syncedEventId) {
      try {
        await deleteEventForClassSchedule(existing[0].syncedEventId);
      } catch (error) {
        console.error("Error deleting synced event:", error);
        // Don't fail the request
      }
    }

    // Delete the class schedule
    await db
      .delete(classSchedules)
      .where(
        and(
          eq(classSchedules.id, id),
          eq(classSchedules.userId, session.userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Class schedule DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
