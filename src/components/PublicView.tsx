"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import { id } from "date-fns/locale";
import { getCategoryLabel } from "@/lib/event-utils";

type EventData = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  category: string;
  startTime: string;
  endTime: string;
  status: string;
};

const categoryColors: Record<string, string> = {
  teaching: "bg-blue-100 text-blue-800 border-l-blue-500",
  course: "bg-purple-100 text-purple-800 border-l-purple-500",
  meeting: "bg-red-100 text-red-800 border-l-red-500",
  mentoring: "bg-green-100 text-green-800 border-l-green-500",
  research: "bg-amber-100 text-amber-800 border-l-amber-500",
  other: "bg-slate-100 text-slate-800 border-l-slate-500",
};

export default function PublicView() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDays, setViewDays] = useState(7);

  useEffect(() => {
    const fetchPublicEvents = async () => {
      const start = startOfDay(new Date()).toISOString();
      const end = endOfDay(addDays(new Date(), viewDays - 1)).toISOString();

      try {
        const res = await fetch(
          `/api/events?start=${start}&end=${end}&public=true`
        );
        const data = await res.json();
        setEvents(data.events || []);
      } catch {
        setEvents([]);
      }
      setLoading(false);
    };
    fetchPublicEvents();
  }, [viewDays]);

  // Group events by date
  const groupedEvents: Record<string, EventData[]> = {};
  events.forEach((ev) => {
    const dateKey = format(new Date(ev.startTime), "yyyy-MM-dd");
    if (!groupedEvents[dateKey]) groupedEvents[dateKey] = [];
    groupedEvents[dateKey].push(ev);
  });

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Public header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 mb-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
            📅
          </div>
          <div>
            <h2 className="text-2xl font-bold">Jadwal Publik</h2>
            <p className="text-blue-200 text-sm">
              Lihat agenda dan jadwal kegiatan yang akan datang
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {[
            { days: 1, label: "Hari Ini" },
            { days: 7, label: "7 Hari" },
            { days: 14, label: "14 Hari" },
            { days: 30, label: "30 Hari" },
          ].map((opt) => (
            <button
              key={opt.days}
              onClick={() => setViewDays(opt.days)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                viewDays === opt.days
                  ? "bg-white text-blue-700"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            Tidak Ada Agenda
          </h3>
          <p className="text-slate-500">
            Belum ada kegiatan yang dijadwalkan untuk periode ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const dayEvents = groupedEvents[dateKey].sort(
              (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );

            return (
              <div key={dateKey} className="animate-slide-up">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                      isToday(date)
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {format(date, "dd")}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {format(date, "EEEE", { locale: id })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(date, "d MMMM yyyy", { locale: id })}
                      {isToday(date) && (
                        <span className="ml-2 text-blue-600 font-medium">
                          • Hari Ini
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 ml-3 pl-6 border-l-2 border-slate-200">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id + ev.startTime}
                      className={`p-4 rounded-xl border-l-4 ${categoryColors[ev.category] || categoryColors.other} bg-white shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">
                            {ev.title}
                          </h4>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              ⏰{" "}
                              {format(new Date(ev.startTime), "HH:mm")} -{" "}
                              {format(new Date(ev.endTime), "HH:mm")}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                📍 {ev.location}
                              </span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-xs text-slate-500 mt-2">
                              {ev.description}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-white/80 rounded-lg text-xs font-medium">
                          {getCategoryLabel(ev.category)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <div className="mt-8 text-center text-xs text-slate-400 pb-4">
        <p>
          Halaman ini dapat diakses oleh mahasiswa dan publik tanpa login.
        </p>
        <p className="mt-1">
          Data diperbarui secara otomatis • JadwalKu © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
