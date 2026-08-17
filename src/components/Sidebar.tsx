"use client";

import React from "react";
import { UserSession, AppView } from "./AppShell";

type Props = {
  user: UserSession;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onLogin: () => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
};

const menuItems: { view: AppView; label: string; icon: string; requireAuth?: boolean; adminOnly?: boolean }[] = [
  { view: "calendar", label: "Kalender", icon: "📅" },
  { view: "today", label: "Hari Ini", icon: "🕐" },
  { view: "week", label: "Minggu Ini", icon: "📆" },
  { view: "classSchedule", label: "Jadwal Mengajar Kelas", icon: "🏫" },
  { view: "report", label: "Laporan", icon: "📊", requireAuth: true },
  { view: "chat", label: "Asisten AI", icon: "🤖" },
  { view: "admin", label: "Manajemen Admin", icon: "⚙️", adminOnly: true },
  { view: "public", label: "Jadwal Publik", icon: "👥" },
];

export default function Sidebar({
  user,
  currentView,
  onNavigate,
  onLogin,
  onLogout,
  isOpen,
  onClose,
}: Props) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl">
              📋
            </div>
            <div>
              <h1 className="text-xl font-bold">JadwalKu</h1>
              <p className="text-xs text-slate-400">Manajemen Jadwal</p>
            </div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.fullName}</p>
                <p className="text-xs text-slate-400 truncate">@{user.username}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-3 flex-1">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (item.requireAuth && !user) return null;
              if (item.adminOnly && (!user || user.role !== "admin")) return null;
              return (
                <li key={item.view}>
                  <button
                    onClick={() => onNavigate(item.view)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      currentView === item.view
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Auth buttons */}
        <div className="p-4 border-t border-slate-700">
          {user ? (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-900/30 transition-colors"
            >
              <span className="text-lg">🚪</span>
              Keluar
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              <span className="text-lg">🔑</span>
              Masuk sebagai Admin
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
