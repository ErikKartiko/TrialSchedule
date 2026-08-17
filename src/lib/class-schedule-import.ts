import * as XLSX from "xlsx";
import { normalizeDayName } from "./class-schedule-utils";

export type ParsedClassSchedule = {
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  className: string;
  room: string;
  teachers: string[];
};

export type ImportWarning = {
  rowGroup: number;
  message: string;
};

function cellStr(val: unknown): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

/**
 * Parses an uploaded Excel buffer matching the "Jadwal Mengajar" template:
 * Columns: No | Waktu | Matakuliah | Tim Pengajar | Tempat
 * Where "Waktu" contains "Hari : X" on the first row of a block and
 * "Jam : HH:mm - HH:mm WIB" on a following row (merged cells),
 * "Tempat" contains "Kelas : X" on the first row and "Ruang : ..." on a
 * following row, and "Tim Pengajar" may list one teacher per row.
 */
export function parseClassScheduleExcel(buffer: Buffer): {
  entries: ParsedClassSchedule[];
  warnings: ImportWarning[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const entries: ParsedClassSchedule[] = [];
  const warnings: ImportWarning[] = [];

  // Try to detect header row & column order dynamically.
  // Default expected order: No, Waktu, Matakuliah, Tim Pengajar, Tempat
  let startRowIdx = 0;
  let colNo = 0,
    colWaktu = 1,
    colMatkul = 2,
    colPengajar = 3,
    colTempat = 4;

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i].map((c) => cellStr(c).toLowerCase());
    const idxNo = row.findIndex((c) => c === "no");
    const idxWaktu = row.findIndex((c) => c.includes("waktu"));
    const idxMatkul = row.findIndex((c) => c.includes("matakuliah") || c.includes("mata kuliah"));
    const idxPengajar = row.findIndex((c) => c.includes("pengajar"));
    const idxTempat = row.findIndex((c) => c.includes("tempat"));

    if (idxWaktu >= 0 && idxMatkul >= 0) {
      startRowIdx = i + 1;
      colNo = idxNo >= 0 ? idxNo : 0;
      colWaktu = idxWaktu;
      colMatkul = idxMatkul;
      colPengajar = idxPengajar >= 0 ? idxPengajar : 3;
      colTempat = idxTempat >= 0 ? idxTempat : 4;
      break;
    }
  }

  let current: {
    rowGroup: number;
    day: string | null;
    jamRaw: string | null;
    courseRaw: string | null;
    kelas: string | null;
    ruang: string | null;
    teachers: string[];
  } | null = null;

  let groupCounter = 0;

  const pushCurrent = () => {
    if (!current) return;
    const dayNorm = current.day ? normalizeDayName(current.day) : null;
    if (!dayNorm) {
      warnings.push({
        rowGroup: current.rowGroup,
        message: `Tidak dapat mengenali hari: "${current.day || "-"}"`,
      });
    }

    const jamMatch = (current.jamRaw || "").match(
      /(\d{1,2}[:.]\d{2})\s*-\s*(\d{1,2}[:.]\d{2})/
    );
    let startTime = "";
    let endTime = "";
    if (jamMatch) {
      startTime = jamMatch[1].replace(".", ":");
      endTime = jamMatch[2].replace(".", ":");
    } else {
      warnings.push({
        rowGroup: current.rowGroup,
        message: `Tidak dapat mengenali jam: "${current.jamRaw || "-"}"`,
      });
    }

    let courseCode = "";
    let courseName = current.courseRaw || "";
    const courseMatch = (current.courseRaw || "").match(/^([A-Za-z0-9]+)\s*-\s*(.+)$/);
    if (courseMatch) {
      courseCode = courseMatch[1].trim();
      courseName = courseMatch[2].trim();
    }

    if (!courseName) {
      warnings.push({
        rowGroup: current.rowGroup,
        message: "Nama mata kuliah kosong, baris dilewati",
      });
      current = null;
      return;
    }

    entries.push({
      day: dayNorm || "senin",
      startTime: startTime || "00:00",
      endTime: endTime || "00:00",
      courseCode,
      courseName,
      className: current.kelas || "",
      room: current.ruang || "",
      teachers: current.teachers.filter(Boolean),
    });

    current = null;
  };

  for (let i = startRowIdx; i < rows.length; i++) {
    const row = rows[i] || [];
    const noVal = cellStr(row[colNo]);
    const waktuVal = cellStr(row[colWaktu]);
    const matkulVal = cellStr(row[colMatkul]);
    const pengajarVal = cellStr(row[colPengajar]);
    const tempatVal = cellStr(row[colTempat]);

    // Skip fully empty rows
    if (!noVal && !waktuVal && !matkulVal && !pengajarVal && !tempatVal) {
      continue;
    }

    const isNewEntry = noVal !== "";

    if (isNewEntry) {
      // finalize previous entry
      pushCurrent();
      groupCounter++;
      current = {
        rowGroup: groupCounter,
        day: null,
        jamRaw: null,
        courseRaw: null,
        kelas: null,
        ruang: null,
        teachers: [],
      };
    }

    if (!current) {
      // Continuation row before any entry started - skip
      continue;
    }

    const hariMatch = waktuVal.match(/hari\s*:\s*(.+)/i);
    if (hariMatch) current.day = hariMatch[1].trim();

    const jamMatch = waktuVal.match(/jam\s*:\s*(.+)/i);
    if (jamMatch) current.jamRaw = jamMatch[1].trim();

    if (matkulVal) current.courseRaw = matkulVal;

    const kelasMatch = tempatVal.match(/kelas\s*:\s*(.+)/i);
    if (kelasMatch) current.kelas = kelasMatch[1].trim();

    const ruangMatch = tempatVal.match(/ruang\s*:\s*(.+)/i);
    if (ruangMatch) current.ruang = ruangMatch[1].trim();

    if (pengajarVal) current.teachers.push(pengajarVal);
  }

  pushCurrent();

  return { entries, warnings };
}
