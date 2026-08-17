import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
  format,
} from "date-fns";

export type EventRow = typeof events.$inferSelect;

export async function getEventsForRange(
  userId: string,
  start: Date,
  end: Date
) {
  const baseEvents = await db
    .select()
    .from(events)
    .where(eq(events.userId, userId));

  const expandedEvents: EventRow[] = [];

  for (const ev of baseEvents) {
    if (ev.recurrence === "none") {
      if (
        (ev.startTime >= start && ev.startTime <= end) ||
        (ev.endTime >= start && ev.endTime <= end) ||
        (ev.startTime <= start && ev.endTime >= end)
      ) {
        expandedEvents.push(ev);
      }
    } else {
      const recEnd = ev.recurrenceEnd || end;
      const maxEnd = isBefore(recEnd, end) ? recEnd : end;
      let current = new Date(ev.startTime);
      const duration = ev.endTime.getTime() - ev.startTime.getTime();

      let iterations = 0;
      while (isBefore(current, maxEnd) && iterations < 365) {
        const occurrenceEnd = new Date(current.getTime() + duration);
        if (
          (current >= start && current <= end) ||
          (occurrenceEnd >= start && occurrenceEnd <= end)
        ) {
          expandedEvents.push({
            ...ev,
            startTime: new Date(current),
            endTime: occurrenceEnd,
          });
        }

        switch (ev.recurrence) {
          case "daily":
            current = addDays(current, 1);
            break;
          case "weekly":
            current = addWeeks(current, 1);
            break;
          case "monthly":
            current = addMonths(current, 1);
            break;
          case "yearly":
            current = addYears(current, 1);
            break;
          default:
            iterations = 999;
        }
        iterations++;
      }
    }
  }

  return expandedEvents;
}

export async function getEventsForDay(userId: string, date: Date) {
  return getEventsForRange(userId, startOfDay(date), endOfDay(date));
}

export async function getEventsForMonth(userId: string, date: Date) {
  return getEventsForRange(userId, startOfMonth(date), endOfMonth(date));
}

export {
  getCategoryColor,
  getCategoryLabel,
  getStatusLabel,
  getRecurrenceLabel,
} from "./event-utils";
