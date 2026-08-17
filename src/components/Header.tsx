"use client";

import React from "react";
import { UserSession, AppView } from "./AppShell";

type Props = {
  user: UserSession;
  currentView: AppView;
  onMenuToggle: () => void;
  onCreateEvent: () => void;
  voiceActive: boolean;
  onVoiceToggle: () => void;
  onLogin: () => void;
};

const viewTitles: Record<AppView, string> = {
  calendar: "Kalender",
  today: "Agenda Hari Ini",
  week: "Agenda Minggu Ini",
  classSchedule: "Jadwal Mengajar Kelas",
  report: "Laporan",
  chat: "Asisten AI",
  admin: "Manajemen Admin",
  public: "Jadwal Publik",
};

export default function Header({
  user,
  currentView,
  onMenuToggle,
  onCreateEvent,
  voiceActive,
  onVoiceToggle,
  onLogin,
}: Props) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {viewTitles[currentView]}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">{dateStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice toggle */}
          <button
            onClick={onVoiceToggle}
            className={`p-2 rounded-lg transition-all duration-200 ${
              voiceActive
                ? "bg-red-100 text-red-600 animate-pulse"
                : "hover:bg-slate-100 text-slate-600"
            }`}
            title="Voice Command (Perintah Suara)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Create event button */}
          {user && (
            <button
              onClick={onCreateEvent}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Agenda
            </button>
          )}

          {/* Mobile create button */}
          {user && (
            <button
              onClick={onCreateEvent}
              className="sm:hidden p-2 bg-blue-600 text-white rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}

          {!user && (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all"
            >
              🔑 Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
