import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classSchedules } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { parseClassScheduleExcel } from "@/lib/class-schedule-import";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const semester = (formData.get("semester") as string | null) || null;

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { entries, warnings } = parseClassScheduleExcel(buffer);

    if (entries.length === 0) {
      return NextResponse.json(
        {
          error:
            "Tidak ada data jadwal yang bisa dikenali dari file ini. Pastikan format sesuai template.",
          warnings,
        },
        { status: 400 }
      );
    }

    const inserted = await db
      .insert(classSchedules)
      .values(
        entries.map((e) => ({
          userId: session.userId,
          day: e.day as
            | "senin"
            | "selasa"
            | "rabu"
            | "kamis"
            | "jumat"
            | "sabtu"
            | "minggu",
          startTime: e.startTime,
          endTime: e.endTime,
          courseCode: e.courseCode || null,
          courseName: e.courseName,
          className: e.className || null,
          room: e.room || null,
          teachers: e.teachers,
          semester,
        }))
      )
      .returning();

    return NextResponse.json({
      imported: inserted.length,
      schedules: inserted,
      warnings,
    });
  } catch (error) {
    console.error("Class schedule import error:", error);
    return NextResponse.json(
      { error: "Gagal memproses file Excel" },
      { status: 500 }
    );
  }
}
