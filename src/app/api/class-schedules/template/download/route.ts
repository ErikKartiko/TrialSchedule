import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    // Buat worksheet dengan data template
    const headers = [
      "Hari",
      "Jam Mulai (HH:mm)",
      "Jam Selesai (HH:mm)",
      "Kode MK",
      "Mata Kuliah",
      "Kelas",
      "Ruangan",
      "Pengajar 1",
      "Pengajar 2",
      "Pengajar 3",
      "Semester",
      "Catatan",
    ];

    const exampleData = [
      [
        "Senin",
        "08:00",
        "09:40",
        "KSF1102",
        "Bahasa Pemrograman",
        "A",
        "Ruang Kuliah CDAST 2",
        "Dr. Budi Santoso",
        "Ir. Ani Wijaya",
        "",
        "Ganjil 2024/2025",
        "Perkuliahan interaktif",
      ],
      [
        "Selasa",
        "10:00",
        "11:40",
        "KSF1103",
        "Basis Data",
        "B",
        "Lab Komputer 3",
        "Dr. Siti Nurhaliza",
        "",
        "",
        "Ganjil 2024/2025",
        "",
      ],
      [
        "Rabu",
        "13:00",
        "14:40",
        "KSF1104",
        "Algoritma dan Struktur Data",
        "C",
        "Ruang Kuliah CDAST 1",
        "Prof. Ahmad Santoso",
        "Dr. Dewi Pertiwi",
        "",
        "Ganjil 2024/2025",
        "",
      ],
    ];

    // Validasi data
    const validDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    const helpText = [
      ["PANDUAN PENGISIAN:"],
      [""],
      ["Hari: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, atau Minggu"],
      ["Jam Mulai & Jam Selesai: Format HH:mm (contoh: 08:00, 14:30)"],
      ["Pengajar: Masukkan nama dosen di kolom terpisah, bisa sampai 3 dosen"],
      ["Kolom yang boleh kosong: Kode MK, Pengajar 2, Pengajar 3, Catatan"],
      [""],
      ["CONTOH DATA:"],
    ];

    // Buat workbook
    const ws = XLSX.utils.aoa_to_sheet([
      ...helpText,
      headers,
      ...exampleData,
    ]);

    // Set column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 25 },
      { wch: 8 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
    ];

    // Styling header (frozen rows)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Kelas");

    // Buat buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="template-jadwal-kelas.xlsx"',
      },
    });
  } catch (error) {
    console.error("Template download error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
