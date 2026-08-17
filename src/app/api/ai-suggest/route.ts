import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();
    const lower = text.toLowerCase();

    // Simple AI-like parsing for scheduling from text/voice input
    const suggestion: Record<string, string> = {};

    // Extract category
    if (lower.includes("mengajar") || lower.includes("ajar") || lower.includes("kuliah")) {
      suggestion.category = "teaching";
    } else if (lower.includes("kursus") || lower.includes("pelatihan") || lower.includes("workshop")) {
      suggestion.category = "course";
    } else if (lower.includes("rapat") || lower.includes("meeting") || lower.includes("pertemuan")) {
      suggestion.category = "meeting";
    } else if (lower.includes("bimbingan") || lower.includes("mentoring") || lower.includes("skripsi") || lower.includes("tesis")) {
      suggestion.category = "mentoring";
    } else if (lower.includes("penelitian") || lower.includes("riset") || lower.includes("research")) {
      suggestion.category = "research";
    }

    // Extract time patterns
    const timeMatch = lower.match(/jam\s+(\d{1,2})(?:[:.:](\d{2}))?/);
    if (timeMatch) {
      const hour = timeMatch[1].padStart(2, "0");
      const min = timeMatch[2] || "00";
      suggestion.startHour = hour;
      suggestion.startMin = min;
    }

    const durationMatch = lower.match(/(\d+)\s*jam/);
    if (durationMatch && !timeMatch) {
      // Only if not already matched "jam X"
    }

    // Extract recurrence
    if (lower.includes("setiap hari") || lower.includes("tiap hari") || lower.includes("harian")) {
      suggestion.recurrence = "daily";
    } else if (lower.includes("setiap minggu") || lower.includes("tiap minggu") || lower.includes("mingguan")) {
      suggestion.recurrence = "weekly";
    } else if (lower.includes("setiap bulan") || lower.includes("tiap bulan") || lower.includes("bulanan")) {
      suggestion.recurrence = "monthly";
    } else if (lower.includes("setiap tahun") || lower.includes("tiap tahun") || lower.includes("tahunan")) {
      suggestion.recurrence = "yearly";
    }

    // Extract location
    const roomMatch = lower.match(/(?:di|ruang|gedung|aula|lab)\s+([a-zA-Z0-9\s]+?)(?:\s+(?:jam|pukul|pada|tanggal)|$)/i);
    if (roomMatch) {
      suggestion.location = roomMatch[1].trim();
    }

    // Try to extract title - use the most meaningful phrase
    const titleCandidates = [
      "rapat jurusan", "rapat fakultas", "rapat dosen", "rapat prodi",
      "kuliah", "mengajar", "bimbingan skripsi", "bimbingan tesis",
      "seminar", "workshop", "pelatihan", "penelitian",
    ];
    for (const candidate of titleCandidates) {
      if (lower.includes(candidate)) {
        suggestion.title = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        break;
      }
    }

    if (!suggestion.title && text.length > 3) {
      // Use the first meaningful phrase as title
      suggestion.title = text.split(/[,.]/)[ 0].trim();
      if (suggestion.title.length > 50) {
        suggestion.title = suggestion.title.substring(0, 50);
      }
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
