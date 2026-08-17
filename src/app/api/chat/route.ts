import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, users, classSchedules } from "@/db/schema";
import { eq, gte, lte, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDayLabel, normalizeDayName, DAYS_ORDER } from "@/lib/class-schedule-utils";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  addDays,
  parse,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";

function parseUserMessage(message: string): {
  intent: string;
  data: Record<string, string>;
} {
  const lower = message.toLowerCase();

  // Intent: create event
  if (
    lower.includes("buat") ||
    lower.includes("tambah") ||
    lower.includes("jadwal") ||
    lower.includes("atur") ||
    lower.includes("add") ||
    lower.includes("create")
  ) {
    return { intent: "create_suggestion", data: { raw: message } };
  }

  // Intent: show schedule
  if (
    lower.includes("lihat") ||
    lower.includes("apa saja") ||
    lower.includes("agenda") ||
    lower.includes("jadwal hari") ||
    lower.includes("show") ||
    lower.includes("tampilkan")
  ) {
    if (lower.includes("besok") || lower.includes("tomorrow")) {
      return { intent: "show_schedule", data: { period: "tomorrow" } };
    }
    if (lower.includes("minggu") || lower.includes("week")) {
      return { intent: "show_schedule", data: { period: "week" } };
    }
    if (lower.includes("bulan") || lower.includes("month")) {
      return { intent: "show_schedule", data: { period: "month" } };
    }
    return { intent: "show_schedule", data: { period: "today" } };
  }

  // Intent: help
  if (
    lower.includes("bantu") ||
    lower.includes("help") ||
    lower.includes("bisa apa") ||
    lower.includes("fitur")
  ) {
    return { intent: "help", data: {} };
  }

  // Intent: report
  if (lower.includes("laporan") || lower.includes("report")) {
    return { intent: "report", data: {} };
  }

  // Intent: class teaching schedule
  if (
    lower.includes("jadwal mengajar") ||
    lower.includes("jadwal kelas") ||
    lower.includes("mata kuliah") ||
    lower.includes("matkul") ||
    lower.includes("mengajar hari") ||
    lower.includes("ngajar")
  ) {
    for (const d of DAYS_ORDER) {
      if (lower.includes(d)) {
        return { intent: "class_schedule", data: { day: d } };
      }
    }
    return { intent: "class_schedule", data: {} };
  }

  return { intent: "general", data: { raw: message } };
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const session = await getSession();

    const parsed = parseUserMessage(message);
    let response = "";

    switch (parsed.intent) {
      case "help":
        response = `🤖 Halo! Saya adalah asisten penjadwalan Anda. Berikut yang bisa saya bantu:

📅 **Melihat Jadwal**: "Lihat jadwal hari ini", "Agenda besok", "Jadwal minggu ini"
➕ **Membuat Jadwal**: "Buat jadwal rapat besok jam 10", "Tambah mengajar Senin jam 8"
🏫 **Jadwal Mengajar Kelas**: "Jadwal mengajar hari Senin", "Jadwal kelas saya"
📊 **Laporan**: "Buat laporan bulanan"
🔍 **Pencarian**: "Cari jadwal rapat"

Anda juga bisa menggunakan fitur **voice command** dengan menekan tombol mikrofon! 🎤`;
        break;

      case "show_schedule":
        if (session) {
          const now = new Date();
          let start: Date, end: Date, periodLabel: string;

          switch (parsed.data.period) {
            case "tomorrow":
              start = startOfDay(addDays(now, 1));
              end = endOfDay(addDays(now, 1));
              periodLabel = "besok";
              break;
            case "week":
              start = startOfWeek(now, { weekStartsOn: 1 });
              end = endOfWeek(now, { weekStartsOn: 1 });
              periodLabel = "minggu ini";
              break;
            case "month":
              start = startOfMonth(now);
              end = endOfMonth(now);
              periodLabel = "bulan ini";
              break;
            default:
              start = startOfDay(now);
              end = endOfDay(now);
              periodLabel = "hari ini";
          }

          const evts = await db
            .select()
            .from(events)
            .where(
              and(
                eq(events.userId, session.userId),
                gte(events.startTime, start),
                lte(events.startTime, end)
              )
            );

          if (evts.length === 0) {
            response = `📅 Tidak ada agenda ${periodLabel}. Jadwal Anda kosong! Mau menambahkan kegiatan?`;
          } else {
            response = `📅 **Agenda ${periodLabel}** (${evts.length} kegiatan):\n\n`;
            evts.forEach((ev, i) => {
              const time = format(ev.startTime, "HH:mm");
              const endTime = format(ev.endTime, "HH:mm");
              const statusIcon =
                ev.status === "completed"
                  ? "✅"
                  : ev.status === "cancelled"
                    ? "❌"
                    : "📌";
              response += `${statusIcon} **${i + 1}. ${ev.title}**\n   ⏰ ${time} - ${endTime}${ev.location ? ` | 📍 ${ev.location}` : ""}\n\n`;
            });
          }
        } else {
          response =
            "🔒 Silakan login terlebih dahulu untuk melihat jadwal Anda.";
        }
        break;

      case "create_suggestion":
        if (!session) {
          response =
            "🔒 Silakan login terlebih dahulu untuk membuat jadwal baru.";
        } else {
          response = `✨ Saya bisa membantu membuat jadwal! Silakan gunakan form **Tambah Agenda** di kalender, atau beritahu saya detail berikut:

📝 **Judul kegiatan**: (contoh: Rapat Jurusan)
📅 **Tanggal**: (contoh: besok, 15 Januari 2025)
⏰ **Waktu**: (contoh: 09:00 - 11:00)
📍 **Lokasi**: (contoh: Ruang Rapat Lt.2)
🏷️ **Kategori**: Mengajar / Kursus / Rapat / Pembimbingan / Penelitian / Lainnya
🔄 **Pengulangan**: Tidak / Harian / Mingguan / Bulanan / Tahunan

💡 **Tips**: Anda juga bisa menggunakan voice command untuk mengisi form lebih cepat!`;
        }
        break;

      case "report":
        response = `📊 Untuk membuat laporan, silakan buka menu **Laporan** di navigasi. Anda bisa:

📄 **Export PDF** - Laporan lengkap dalam format PDF
📗 **Export Excel** - Data agenda dalam format spreadsheet

Filter berdasarkan:
- 📅 Periode (harian / bulanan)
- ✅ Status (dijadwalkan / selesai / dibatalkan)
- 🏷️ Kategori kegiatan`;
        break;

      case "class_schedule": {
        if (!session) {
          response =
            "🔒 Silakan login terlebih dahulu untuk melihat jadwal mengajar kelas.";
          break;
        }

        const dayFilter = parsed.data.day
          ? normalizeDayName(parsed.data.day)
          : null;

        const allSchedules = await db
          .select()
          .from(classSchedules)
          .where(eq(classSchedules.userId, session.userId));

        const filtered = dayFilter
          ? allSchedules.filter((s) => s.day === dayFilter)
          : allSchedules;

        if (filtered.length === 0) {
          response = dayFilter
            ? `📭 Tidak ada jadwal mengajar pada hari ${getDayLabel(dayFilter)}.`
            : "📭 Belum ada jadwal mengajar kelas. Silakan tambahkan di menu **Jadwal Mengajar Kelas** atau import dari Excel.";
          break;
        }

        filtered.sort((a, b) => {
          if (a.day !== b.day) {
            return DAYS_ORDER.indexOf(a.day as (typeof DAYS_ORDER)[number]) -
              DAYS_ORDER.indexOf(b.day as (typeof DAYS_ORDER)[number]);
          }
          return a.startTime.localeCompare(b.startTime);
        });

        response = dayFilter
          ? `🏫 **Jadwal Mengajar - ${getDayLabel(dayFilter)}** (${filtered.length} kelas):\n\n`
          : `🏫 **Jadwal Mengajar Kelas** (${filtered.length} kelas):\n\n`;

        filtered.forEach((s, i) => {
          response += `📚 **${i + 1}. ${s.courseCode ? s.courseCode + " - " : ""}${s.courseName}**\n   📅 ${getDayLabel(s.day)} | ⏰ ${s.startTime} - ${s.endTime}${s.className ? ` | 🎓 Kelas ${s.className}` : ""}${s.room ? ` | 📍 ${s.room}` : ""}${s.teachers.length ? `\n   👤 ${s.teachers.join(", ")}` : ""}\n\n`;
        });
        break;
      }

      default:
        response = `🤖 Terima kasih atas pesan Anda! Saya adalah asisten penjadwalan. 

Beberapa hal yang bisa Anda tanyakan:
- "Lihat jadwal hari ini"
- "Buat jadwal rapat"
- "Agenda besok"
- "Bantuan"

Atau ketik **"help"** untuk melihat semua fitur yang tersedia! 😊`;
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
