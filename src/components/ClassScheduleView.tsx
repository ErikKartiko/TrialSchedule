"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserSession } from "./AppShell";
import { DAYS_ORDER, getDayLabel } from "@/lib/class-schedule-utils";
import ClassScheduleModal from "./ClassScheduleModal";
import ClassScheduleImportModal from "./ClassScheduleImportModal";

export type ClassScheduleData = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  courseCode?: string | null;
  courseName: string;
  className?: string | null;
  room?: string | null;
  teachers: string[];
  semester?: string | null;
  notes?: string | null;
  syncedEventId?: string | null;
  autoSync?: boolean;
};

type Props = {
  user: UserSession;
};

export default function ClassScheduleView({ user }: Props) {
  const [schedules, setSchedules] = useState<ClassScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ClassScheduleData | null>(null);
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToCalendarId, setAddingToCalendarId] = useState<string | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    const publicParam = user ? "" : "?public=true";
    try {
      const res = await fetch(`/api/class-schedules${publicParam}`);
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch {
      setSchedules([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal mengajar ini?")) return;
    try {
      await fetch(`/api/class-schedules/${id}`, { method: "DELETE" });
      fetchSchedules();
      showToast("Jadwal berhasil dihapus");
    } catch {
      showToast("Gagal menghapus jadwal");
    }
  };

  const handleToggleAutoSync = async (id: string, currentAutoSync: boolean) => {
    try {
      const schedule = schedules.find((s) => s.id === id);
      if (!schedule) return;

      const res = await fetch(`/api/class-schedules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...schedule,
          autoSync: !currentAutoSync,
        }),
      });

      if (res.ok) {
        fetchSchedules();
        showToast(
          !currentAutoSync
            ? "✅ Sinkronisasi otomatis diaktifkan"
            : "⏹️ Sinkronisasi otomatis dinonaktifkan"
        );
      } else {
        showToast("Gagal mengubah status sinkronisasi");
      }
    } catch {
      showToast("Gagal mengubah status sinkronisasi");
    }
  };

  const handleAddToCalendar = async (id: string) => {
    setAddingToCalendarId(id);
    try {
      const res = await fetch(`/api/class-schedules/${id}/add-to-calendar`, {
        method: "POST",
      });
      if (res.ok) {
        showToast("✅ Berhasil ditambahkan ke kalender agenda (mingguan)");
      } else {
        showToast("Gagal menambahkan ke kalender");
      }
    } catch {
      showToast("Gagal menambahkan ke kalender");
    }
    setAddingToCalendarId(null);
  };

  const filteredSchedules = schedules.filter((s) => {
    if (dayFilter !== "all" && s.day !== dayFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const haystack = `${s.courseCode} ${s.courseName} ${s.className} ${s.room} ${s.teachers.join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const groupedByDay: Record<string, ClassScheduleData[]> = {};
  DAYS_ORDER.forEach((d) => (groupedByDay[d] = []));
  filteredSchedules.forEach((s) => {
    if (!groupedByDay[s.day]) groupedByDay[s.day] = [];
    groupedByDay[s.day].push(s);
  });
  Object.keys(groupedByDay).forEach((d) => {
    groupedByDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  const daysToShow =
    dayFilter === "all" ? DAYS_ORDER : DAYS_ORDER.filter((d) => d === dayFilter);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg animate-slide-right text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🏫 Jadwal Mengajar Kelas
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              Timetable mingguan: hari, jam, mata kuliah, ruangan, kelas, dan
              pengajar
            </p>
          </div>

          {user && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-medium text-sm hover:bg-indigo-50 transition-colors shadow-md"
              >
                ➕ Tambah Jadwal
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 bg-white/20 text-white rounded-xl font-medium text-sm hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                📤 Import Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <button
            onClick={() => setDayFilter("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              dayFilter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua Hari
          </button>
          {DAYS_ORDER.map((d) => (
            <button
              key={d}
              onClick={() => setDayFilter(d)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                dayFilter === d
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {getDayLabel(d)}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Cari matkul, kelas, ruangan, pengajar..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-4">🗓️</div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Belum Ada Jadwal Mengajar
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            {user
              ? "Tambahkan jadwal secara manual atau import dari file Excel."
              : "Admin belum menambahkan jadwal mengajar."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {daysToShow.map((day) => {
            const dayEvents = groupedByDay[day] || [];
            if (dayEvents.length === 0) return null;

            return (
              <div key={day} className="animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm font-bold">
                    {getDayLabel(day)}
                  </div>
                  <span className="text-xs text-slate-400">
                    {dayEvents.length} kelas
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Jam
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Mata Kuliah
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Kelas
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Ruangan
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Pengajar
                          </th>
                          {user && (
                            <>
                              <th className="text-center px-4 py-3 font-semibold text-slate-600">
                                Sinkronisasi
                              </th>
                              <th className="text-right px-4 py-3 font-semibold text-slate-600">
                                Aksi
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayEvents.map((s) => (
                          <tr
                            key={s.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-indigo-700">
                              {s.startTime} - {s.endTime}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">
                                {s.courseCode && (
                                  <span className="text-slate-400 mr-1">
                                    {s.courseCode}
                                  </span>
                                )}
                                {s.courseName}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {s.className ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                  {s.className}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[200px]">
                              {s.room || "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 max-w-[220px]">
                              {s.teachers.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {s.teachers.map((t, i) => (
                                    <span key={i} className="text-xs">
                                      👤 {t}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            {user && (
                              <>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center">
                                    {s.autoSync !== false ? (
                                      <span
                                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full cursor-pointer hover:bg-green-200 transition-colors"
                                        onClick={() =>
                                          handleToggleAutoSync(
                                            s.id,
                                            s.autoSync !== false
                                          )
                                        }
                                        title="Otomatis sinkronisasi dengan kalender"
                                      >
                                        ✅ Auto-Sync
                                      </span>
                                    ) : (
                                      <span
                                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full cursor-pointer hover:bg-slate-200 transition-colors"
                                        onClick={() =>
                                          handleToggleAutoSync(s.id, false)
                                        }
                                        title="Sinkronisasi manual saja"
                                      >
                                        ⏸️ Manual
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    {s.syncedEventId ? (
                                      <span
                                        className="text-xs text-green-600 font-medium"
                                        title="Sudah disinkronkan ke kalender"
                                      >
                                        🔄
                                      </span>
                                    ) : (
                                      <span
                                        className="text-xs text-slate-300"
                                        title="Belum disinkronkan"
                                      >
                                        -
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleAddToCalendar(s.id)}
                                      disabled={addingToCalendarId === s.id}
                                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50"
                                      title="Tambahkan ke Kalender Agenda (mingguan)"
                                    >
                                      {addingToCalendarId === s.id ? "⏳" : "📅"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingSchedule(s);
                                        setShowModal(true);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                                      title="Edit"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDelete(s.id)}
                                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                      title="Hapus"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <ClassScheduleModal
          schedule={editingSchedule}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingSchedule(null);
            fetchSchedules();
            showToast("✅ Jadwal berhasil disimpan");
          }}
        />
      )}

      {showImportModal && (
        <ClassScheduleImportModal
          onClose={() => setShowImportModal(false)}
          onImported={(count: number) => {
            setShowImportModal(false);
            fetchSchedules();
            showToast(`✅ Berhasil mengimpor ${count} jadwal dari Excel`);
          }}
        />
      )}
    </div>
  );
}
