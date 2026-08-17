import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classSchedules, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { syncClassScheduleToCalendar } from "@/lib/class-schedule-sync";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicView = searchParams.get("public") === "true";

    let userId: string;
    if (publicView) {
      const allUsers = await db.select().from(users).limit(1);
      if (allUsers.length === 0) {
        return NextResponse.json({ schedules: [] });
      }
      userId = allUsers[0].id;
    } else {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.userId;
    }

    const result = await db
      .select()
      .from(classSchedules)
      .where(eq(classSchedules.userId, userId));

    return NextResponse.json({ schedules: result });
  } catch (error) {
    console.error("Class schedules GET error:", error);
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

    if (!body.courseName || !body.day || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const created = await db
      .insert(classSchedules)
      .values({
        userId: session.userId,
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
      })
      .returning();

    // Auto-sync to calendar if enabled
    if (created[0].autoSync) {
      try {
        await syncClassScheduleToCalendar(created[0].id, {
          userId: session.userId,
          day: created[0].day,
          startTime: created[0].startTime,
          endTime: created[0].endTime,
          courseCode: created[0].courseCode,
          courseName: created[0].courseName,
          className: created[0].className,
          room: created[0].room,
          teachers: created[0].teachers,
          semester: created[0].semester,
          notes: created[0].notes,
        });
      } catch (error) {
        console.error("Error syncing to calendar:", error);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ schedule: created[0] });
  } catch (error) {
    console.error("Class schedules POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
