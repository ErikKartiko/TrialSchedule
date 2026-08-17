"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import { id } from "date-fns/locale";
import { UserSession } from "./AppShell";
import { getCategoryLabel } from "@/lib/event-utils";
import {
  getClassSchedulesForDateRange,
  ClassScheduleDisplay,
} from "@/lib/class-schedule-utils";

type EventData = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  category: string;
  startTime: string;
  endTime: string;
  recurrence: string;
  status: string;
  color?: string;
};

type Props = {
  user: UserSession;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onCreateEvent: (d?: Date) => void;
  onEditEvent: (e: Record<string, unknown>) => void;
  viewMode: "month" | "week" | "day";
};

const categoryColors: Record<string, string> = {
  teaching: "bg-blue-100 text-blue-800 border-blue-300",
  course: "bg-purple-100 text-purple-800 border-purple-300",
  meeting: "bg-red-100 text-red-800 border-red-300",
  mentoring: "bg-green-100 text-green-800 border-green-300",
  research: "bg-amber-100 text-amber-800 border-amber-300",
  other: "bg-slate-100 text-slate-800 border-slate-300",
};

const statusIcons: Record<string, string> = {
  scheduled: "📌",
  completed: "✅",
  cancelled: "❌",
};

export default function CalendarView({
  user,
  selectedDate,
  onSelectDate,
  onCreateEvent,
  onEditEvent,
  viewMode,
}: Props) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [events, setEvents] = useState<EventData[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassScheduleDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    let start: Date, end: Date;

    if (viewMode === "month") {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    } else if (viewMode === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
    }

    const isPublic = !user;
    const eventUrl = `/api/events?start=${start.toISOString()}&end=${end.toISOString()}${isPublic ? "&public=true" : ""}`;

    try {
      // Fetch events
      const res = await fetch(eventUrl);
      const data = await res.json();
      setEvents(data.events || []);

      // Fetch class schedules if user is logged in
      if (user) {
        try {
          const schedRes = await fetch("/api/class-schedules");
          const schedData = await schedRes.json();
          const converted = getClassSchedulesForDateRange(
            schedData.schedules || [],
            start,
            end
          );
          setClassSchedules(converted);
        } catch {
          setClassSchedules([]);
        }
      } else {
        setClassSchedules([]);
      }
    } catch {
      setEvents([]);
      setClassSchedules([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, user, viewMode]);

  const navigate = (dir: number) => {
    if (viewMode === "month") {
      setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, dir));
    }
  };

  const getEventsForDate = (date: Date) => {
    const eventList = events.filter((ev) => {
      const evDate = new Date(ev.startTime);
      return isSameDay(evDate, date);
    });

    const scheduleList = classSchedules.filter((sched) => {
      const schedDate = new Date(sched.startTime);
      return isSameDay(schedDate, date);
    });

    return { events: eventList, schedules: scheduleList };
  };

  // Month view
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-t-xl overflow-hidden">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
            <div
              key={day}
              className="bg-slate-50 py-2 text-center text-xs font-semibold text-slate-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-b-xl overflow-hidden">
          {days.map((day, idx) => {
            const dayData = getEventsForDate(day);
            const allItems = [
              ...dayData.events.map((e) => ({ ...e, type: "event" as const })),
              ...dayData.schedules.map((s) => ({ ...s, type: "schedule" as const })),
            ].sort(
              (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <div
                key={idx}
                className={`bg-white min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                  !isCurrentMonth ? "bg-slate-50/80" : ""
                }`}
                onClick={() => {
                  onSelectDate(day);
                  if (user) onCreateEvent(day);
                }}
              >
                <div
                  className={`text-xs sm:text-sm font-medium mb-1 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                    today
                      ? "bg-blue-600 text-white"
                      : isCurrentMonth
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {format(day, "d")}
                </div>

                <div className="space-y-0.5">
                  {allItems.slice(0, 3).map((item, i) => (
                    <div
                      key={i}
                      className={`text-[10px] sm:text-xs px-1 py-0.5 rounded border-l-2 truncate ${categoryColors[item.category] || categoryColors.other}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === "event") {
                          onEditEvent(item as unknown as Record<string, unknown>);
                        }
                      }}
                      title={`${item.title} - ${format(new Date(item.startTime), "HH:mm")}`}
                    >
                      {statusIcons[item.status]} {format(new Date(item.startTime), "HH:mm")} {item.title}
                    </div>
                  ))}
                  {allItems.length > 3 && (
                    <div className="text-[10px] text-slate-500 pl-1">
                      +{allItems.length - 3} lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Day view
  const renderDayView = () => {
    const dayData = getEventsForDate(currentDate);
    const allItems = [
      ...dayData.events.map((e) => ({ ...e, type: "event" as const })),
      ...dayData.schedules.map((s) => ({ ...s, type: "schedule" as const })),
    ];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto">
          {hours.map((hour) => {
            const hourItems = allItems.filter((item) => {
              const h = new Date(item.startTime).getHours();
              return h === hour;
            });

            return (
              <div
                key={hour}
                className="flex border-b border-slate-100 min-h-[60px] hover:bg-blue-50/30 cursor-pointer"
                onClick={() => user && onCreateEvent(currentDate)}
              >
                <div className="w-16 sm:w-20 py-2 px-2 text-xs sm:text-sm text-slate-500 font-medium border-r border-slate-100 flex-shrink-0">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                <div className="flex-1 p-1 space-y-1">
                  {hourItems.map((item, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${categoryColors[item.category] || categoryColors.other}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === "event") {
                          onEditEvent(item as unknown as Record<string, unknown>);
                        }
                      }}
                    >
                      <div className="font-medium text-sm">
                        {statusIcons[item.status]} {item.title}
                      </div>
                      <div className="text-xs mt-0.5 opacity-75">
                        {format(new Date(item.startTime), "HH:mm")} -{" "}
                        {format(new Date(item.endTime), "HH:mm")}
                        {item.location && ` • 📍 ${item.location}`}
                      </div>
                      <div className="text-xs mt-0.5">
                        🏷️ {getCategoryLabel(item.category)}
                      </div>
                      {item.type === "schedule" && (
                        <div className="text-xs mt-1 text-indigo-600 font-medium">
                          📚 Jadwal Kelas
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {weekDays.map((day, i) => {
            const dayData = getEventsForDate(day);
            const allItems = [
              ...dayData.events.map((e) => ({ ...e, type: "event" as const })),
              ...dayData.schedules.map((s) => ({ ...s, type: "schedule" as const })),
            ].sort(
              (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );

            return (
              <div key={i} className="bg-white">
                <div
                  className={`text-center py-2 border-b border-slate-200 ${isToday(day) ? "bg-blue-50" : ""}`}
                >
                  <div className="text-xs text-slate-500">
                    {format(day, "EEE", { locale: id })}
                  </div>
                  <div
                    className={`text-lg font-bold ${isToday(day) ? "text-blue-600" : "text-slate-700"}`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                <div className="p-1 min-h-[200px] sm:min-h-[400px] space-y-1 overflow-y-auto">
                  {allItems.map((item, j) => (
                    <div
                      key={j}
                      className={`p-1.5 rounded-lg border-l-2 text-[10px] sm:text-xs cursor-pointer hover:shadow-md transition-shadow ${categoryColors[item.category] || categoryColors.other}`}
                      onClick={() => {
                        if (item.type === "event") {
                          onEditEvent(
                            item as unknown as Record<string, unknown>
                          );
                        }
                      }}
                    >
                      <div className="font-medium truncate">
                        {statusIcons[item.status]} {item.title}
                      </div>
                      <div className="opacity-75">
                        {format(new Date(item.startTime), "HH:mm")}
                      </div>
                      {item.type === "schedule" && (
                        <div className="text-[8px] text-indigo-600 font-medium mt-0.5">
                          📚 Kelas
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: id });
    }
    if (viewMode === "week") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 });
      const we = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(ws, "d MMM", { locale: id })} - ${format(we, "d MMM yyyy", { locale: id })}`;
    }
    return format(currentDate, "EEEE, d MMMM yyyy", { locale: id });
  };

  return (
    <div className="animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-lg sm:text-xl font-bold text-slate-800 min-w-[180px] text-center capitalize">
            {getTitle()}
          </h3>

          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors ml-2"
          >
            Hari Ini
          </button>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            📅 <strong>{events.length}</strong> agenda
          </span>
          {classSchedules.length > 0 && (
            <span className="flex items-center gap-1">
              📚 <strong>{classSchedules.length}</strong> kelas
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {viewMode === "month" && renderMonthView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "day" && renderDayView()}
        </>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(categoryColors).map(([key, cls]) => (
          <span key={key} className={`text-xs px-2 py-1 rounded-full border ${cls}`}>
            {getCategoryLabel(key)}
          </span>
        ))}
      </div>
    </div>
  );
}
