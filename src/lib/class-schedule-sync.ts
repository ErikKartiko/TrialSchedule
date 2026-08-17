import { db } from "@/db";
import { classSchedules, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { dayNameToIndex } from "./class-schedule-utils";
import { addDays, addYears } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export interface ClassScheduleInput {
  userId: string;
  day: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  courseCode?: string | null;
  courseName: string;
  className?: string | null;
  room?: string | null;
  teachers: string[];
  semester?: string | null;
  notes?: string | null;
}

/**
 * Create event from class schedule
 */
export async function createEventFromClassSchedule(
  classScheduleId: string,
  classSchedule: ClassScheduleInput
) {
  try {
    // Find the next occurrence of this day of week starting from today
    const targetDow = dayNameToIndex(classSchedule.day);
    const today = new Date();
    let nextDate = new Date(today);
    for (let i = 0; i < 7; i++) {
      if (nextDate.getDay() === targetDow) break;
      nextDate = addDays(nextDate, 1);
    }

    const [startH, startM] = classSchedule.startTime.split(":").map(Number);
    const [endH, endM] = classSchedule.endTime.split(":").map(Number);

    const startTime = new Date(nextDate);
    startTime.setHours(startH || 0, startM || 0, 0, 0);
    const endTime = new Date(nextDate);
    endTime.setHours(endH || 0, endM || 0, 0, 0);

    const recurrenceEnd = addYears(startTime, 1);

    const title = `${classSchedule.courseCode ? classSchedule.courseCode + " - " : ""}${classSchedule.courseName}${classSchedule.className ? " (Kelas " + classSchedule.className + ")" : ""}`;

    const created = await db
      .insert(events)
      .values({
        id: uuidv4(),
        userId: classSchedule.userId,
        title,
        description: classSchedule.teachers.length
          ? `Pengajar: ${classSchedule.teachers.join(", ")}`
          : classSchedule.notes || null,
        location: classSchedule.room || null,
        category: "teaching",
        startTime,
        endTime,
        recurrence: "weekly",
        recurrenceEnd,
        status: "scheduled",
        reminderMinutes: 15,
        color: "#3B82F6",
        sourceClassScheduleId: classScheduleId,
      })
      .returning();

    // Update class schedule dengan synced event ID
    await db
      .update(classSchedules)
      .set({ syncedEventId: created[0].id })
      .where(eq(classSchedules.id, classScheduleId));

    return created[0];
  } catch (error) {
    console.error("Error creating event from class schedule:", error);
    throw error;
  }
}

/**
 * Update event from class schedule
 */
export async function updateEventFromClassSchedule(
  classScheduleId: string,
  eventId: string,
  classSchedule: ClassScheduleInput
) {
  try {
    const targetDow = dayNameToIndex(classSchedule.day);
    const today = new Date();
    let nextDate = new Date(today);
    for (let i = 0; i < 7; i++) {
      if (nextDate.getDay() === targetDow) break;
      nextDate = addDays(nextDate, 1);
    }

    const [startH, startM] = classSchedule.startTime.split(":").map(Number);
    const [endH, endM] = classSchedule.endTime.split(":").map(Number);

    const startTime = new Date(nextDate);
    startTime.setHours(startH || 0, startM || 0, 0, 0);
    const endTime = new Date(nextDate);
    endTime.setHours(endH || 0, endM || 0, 0, 0);

    const recurrenceEnd = addYears(startTime, 1);

    const title = `${classSchedule.courseCode ? classSchedule.courseCode + " - " : ""}${classSchedule.courseName}${classSchedule.className ? " (Kelas " + classSchedule.className + ")" : ""}`;

    const updated = await db
      .update(events)
      .set({
        title,
        description: classSchedule.teachers.length
          ? `Pengajar: ${classSchedule.teachers.join(", ")}`
          : classSchedule.notes || null,
        location: classSchedule.room || null,
        startTime,
        endTime,
        recurrenceEnd,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    return updated[0];
  } catch (error) {
    console.error("Error updating event from class schedule:", error);
    throw error;
  }
}

/**
 * Delete event when class schedule is deleted
 */
export async function deleteEventForClassSchedule(eventId: string) {
  try {
    await db.delete(events).where(eq(events.id, eventId));
  } catch (error) {
    console.error("Error deleting event for class schedule:", error);
    throw error;
  }
}

/**
 * Sync class schedule (create or update event)
 */
export async function syncClassScheduleToCalendar(
  classScheduleId: string,
  classSchedule: ClassScheduleInput
) {
  try {
    // Check if event already exists
    const existing = await db
      .select()
      .from(classSchedules)
      .where(eq(classSchedules.id, classScheduleId))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Class schedule not found");
    }

    const sched = existing[0];

    if (!sched.autoSync) {
      return null; // Skip sync if auto-sync is disabled
    }

    if (sched.syncedEventId) {
      // Update existing event
      return updateEventFromClassSchedule(
        classScheduleId,
        sched.syncedEventId,
        classSchedule
      );
    } else {
      // Create new event
      return createEventFromClassSchedule(classScheduleId, classSchedule);
    }
  } catch (error) {
    console.error("Error syncing class schedule to calendar:", error);
    throw error;
  }
}
