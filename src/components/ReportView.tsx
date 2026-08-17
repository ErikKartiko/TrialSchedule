"use client";

import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { UserSession } from "./AppShell";
import { getCategoryLabel, getStatusLabel } from "@/lib/event-utils";

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
};

type Props = {
  user: UserSession;
};

export default function ReportView({ user }: Props) {
  const [period, setPeriod] = useState<"daily" | "monthly">("monthly");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [reportEvents, setReportEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  if (!user) {
    return (
      <div className="animate-fade-in text-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">
          Login Diperlukan
        </h3>
        <p className="text-slate-500">
          Silakan login untuk mengakses laporan.
        </p>
      </div>
    );
  }

  const generateReport = async () => {
    setLoading(true);
    let start: string, end: string;

    if (period === "daily") {
      const d = new Date(selectedDate);
      start = startOfDay(d).toISOString();
      end = endOfDay(d).toISOString();
    } else {
      const d = new Date(selectedMonth + "-01");
      start = startOfMonth(d).toISOString();
      end = endOfMonth(d).toISOString();
    }

    const params = new URLSearchParams({
      start,
      end,
      status: statusFilter,
      category: categoryFilter,
    });

    try {
      const res = await fetch(`/api/report?${params}`);
      const data = await res.json();
      setReportEvents(data.events || []);
      setGenerated(true);
    } catch {
      setReportEvents([]);
    }
    setLoading(false);
  };

  const exportPDF = async () => {
    const jspdfModule = await import("jspdf");
    const jsPDF = jspdfModule.default;
    const autoTableModule = await import("jspdf-autotable");
    const autoTable = autoTableModule.default;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Laporan Agenda - JadwalKu", 14, 22);
    doc.setFontSize(10);
    doc.text(
      `Periode: ${period === "daily" ? selectedDate : selectedMonth}`,
      14,
      30
    );
    doc.text(`Digenerate: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}`, 14, 36);
    doc.text(`Total: ${reportEvents.length} kegiatan`, 14, 42);

    const scheduled = reportEvents.filter((e) => e.status === "scheduled").length;
    const completed = reportEvents.filter((e) => e.status === "completed").length;
    const cancelled = reportEvents.filter((e) => e.status === "cancelled").length;
    doc.text(`Dijadwalkan: ${scheduled} | Selesai: ${completed} | Dibatalkan: ${cancelled}`, 14, 48);

    // Table
    const tableData = reportEvents.map((ev, i) => [
      i + 1,
      ev.title,
      getCategoryLabel(ev.category),
      format(new Date(ev.startTime), "dd/MM/yyyy"),
      `${format(new Date(ev.startTime), "HH:mm")} - ${format(new Date(ev.endTime), "HH:mm")}`,
      ev.location || "-",
      getStatusLabel(ev.status),
    ]);

    autoTable(doc, {
      startY: 54,
      head: [["No", "Kegiatan", "Kategori", "Tanggal", "Waktu", "Lokasi", "Status"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`Laporan_Agenda_${period === "daily" ? selectedDate : selectedMonth}.pdf`);
  };

  const exportExcel = async () => {
    const XLSX = await import("xlsx");

    const data = reportEvents.map((ev, i) => ({
      No: i + 1,
      Kegiatan: ev.title,
      Kategori: getCategoryLabel(ev.category),
      Tanggal: format(new Date(ev.startTime), "dd/MM/yyyy"),
      "Waktu Mulai": format(new Date(ev.startTime), "HH:mm"),
      "Waktu Selesai": format(new Date(ev.endTime), "HH:mm"),
      Lokasi: ev.location || "-",
      Deskripsi: ev.description || "-",
      Status: getStatusLabel(ev.status),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agenda");
    XLSX.writeFile(wb, `Laporan_Agenda_${period === "daily" ? selectedDate : selectedMonth}.xlsx`);
  };

  const stats = {
    total: reportEvents.length,
    scheduled: reportEvents.filter((e) => e.status === "scheduled").length,
    completed: reportEvents.filter((e) => e.status === "completed").length,
    cancelled: reportEvents.filter((e) => e.status === "cancelled").length,
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            📊 Laporan Agenda
          </h3>
          <p className="text-emerald-200 text-sm mt-1">
            Generate dan export laporan kegiatan Anda
          </p>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Periode
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "daily" | "monthly")}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="daily">Harian</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>

            {period === "daily" ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Bulan
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua</option>
                <option value="scheduled">Dijadwalkan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Kategori
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua</option>
                <option value="teaching">Mengajar</option>
                <option value="course">Kursus</option>
                <option value="meeting">Rapat</option>
                <option value="mentoring">Pembimbingan</option>
                <option value="research">Penelitian</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium text-sm hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "⏳ Generating..." : "🔍 Generate Laporan"}
          </button>
        </div>

        {generated && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-xs text-blue-600">Total Kegiatan</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">{stats.scheduled}</div>
                <div className="text-xs text-amber-600">Dijadwalkan</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                <div className="text-xs text-green-600">Selesai</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{stats.cancelled}</div>
                <div className="text-xs text-red-600">Dibatalkan</div>
              </div>
            </div>

            {/* Export buttons */}
            <div className="px-4 sm:px-6 flex gap-3 flex-wrap">
              <button
                onClick={exportPDF}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
              >
                📄 Export PDF
              </button>
              <button
                onClick={exportExcel}
                className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-md flex items-center gap-2"
              >
                📗 Export Excel
              </button>
            </div>

            {/* Table */}
            <div className="p-4 sm:p-6">
              {reportEvents.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p>Tidak ada data untuk periode ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">No</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Kegiatan</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Kategori</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Tanggal</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Waktu</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Lokasi</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportEvents.map((ev, i) => (
                        <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-600">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{ev.title}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {getCategoryLabel(ev.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {format(new Date(ev.startTime), "dd/MM/yyyy")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {format(new Date(ev.startTime), "HH:mm")} - {format(new Date(ev.endTime), "HH:mm")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{ev.location || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                ev.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : ev.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {getStatusLabel(ev.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
