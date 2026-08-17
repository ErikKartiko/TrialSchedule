export const DAYS_ORDER = [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
] as const;

export type DayOfWeek = (typeof DAYS_ORDER)[number];

export function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    senin: "Senin",
    selasa: "Selasa",
    rabu: "Rabu",
    kamis: "Kamis",
    jumat: "Jumat",
    sabtu: "Sabtu",
    minggu: "Minggu",
  };
  return labels[day.toLowerCase()] || day;
}

export function normalizeDayName(raw: string): DayOfWeek | null {
  const cleaned = raw.trim().toLowerCase();
  const map: Record<string, DayOfWeek> = {
    senin: "senin",
    monday: "senin",
    sen: "senin",
    selasa: "selasa",
    tuesday: "selasa",
    sel: "selasa",
    rabu: "rabu",
    wednesday: "rabu",
    rab: "rabu",
    kamis: "kamis",
    thursday: "kamis",
    kam: "kamis",
    jumat: "jumat",
    "jum'at": "jumat",
    friday: "jumat",
    jum: "jumat",
    sabtu: "sabtu",
    saturday: "sabtu",
    sab: "sabtu",
    minggu: "minggu",
    sunday: "minggu",
    min: "minggu",
  };
  return map[cleaned] || null;
}

// Map day name to a JS day-of-week index (0=Sunday .. 6=Saturday)
export function dayNameToIndex(day: string): number {
  const map: Record<string, number> = {
    minggu: 0,
    senin: 1,
    selasa: 2,
    rabu: 3,
    kamis: 4,
    jumat: 5,
    sabtu: 6,
  };
  return map[day.toLowerCase()] ?? 1;
}

// Get day name from date
export function getDayFromDate(date: Date): DayOfWeek {
  const dayIndex = date.getDay();
  const dayMap: Record<number, DayOfWeek> = {
    0: "minggu",
    1: "senin",
    2: "selasa",
    3: "rabu",
    4: "kamis",
    5: "jumat",
    6: "sabtu",
  };
  return dayMap[dayIndex] || "senin";
}

// Convert class schedule to event-like display object
export interface ClassScheduleDisplay {
  id: string;
  type: "class-schedule";
  title: string;
  description?: string;
  location?: string;
  category: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  color?: string;
  status: string;
  courseName: string;
  courseCode?: string;
  className?: string;
  teachers: string[];
}

export function convertClassScheduleToDisplay(
  classSchedule: any,
  date: Date
): ClassScheduleDisplay {
  const [startH, startM] = classSchedule.startTime.split(":").map(Number);
  const [endH, endM] = classSchedule.endTime.split(":").map(Number);

  const startTime = new Date(date);
  startTime.setHours(startH || 0, startM || 0, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(endH || 0, endM || 0, 0, 0);

  const title = `${classSchedule.courseCode ? classSchedule.courseCode + " - " : ""}${classSchedule.courseName}${classSchedule.className ? " (Kelas " + classSchedule.className + ")" : ""}`;

  return {
    id: classSchedule.id,
    type: "class-schedule",
    title,
    description: classSchedule.teachers.length
      ? `Pengajar: ${classSchedule.teachers.join(", ")}`
      : classSchedule.notes || undefined,
    location: classSchedule.room || undefined,
    category: "teaching",
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    color: "#3B82F6",
    status: "scheduled",
    courseName: classSchedule.courseName,
    courseCode: classSchedule.courseCode,
    className: classSchedule.className,
    teachers: classSchedule.teachers,
  };
}

// Get class schedules for date range (converting to events in that range)
export function getClassSchedulesForDateRange(
  schedules: any[],
  startDate: Date,
  endDate: Date
): ClassScheduleDisplay[] {
  const result: ClassScheduleDisplay[] = [];

  // For each day in range
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayName = getDayFromDate(currentDate);

    // Find schedules for this day
    const daySchedules = schedules.filter((s) => s.day === dayName);

    // Convert to display
    daySchedules.forEach((sched) => {
      result.push(convertClassScheduleToDisplay(sched, currentDate));
    });

    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return result;
}
