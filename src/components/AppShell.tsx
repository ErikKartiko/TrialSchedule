"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CalendarView from "./CalendarView";
import EventModal from "./EventModal";
import ChatBot from "./ChatBot";
import ReportView from "./ReportView";
import LoginModal from "./LoginModal";
import PublicView from "./PublicView";
import VoiceCommandOverlay from "./VoiceCommandOverlay";
import NotificationManager from "./NotificationManager";
import ClassScheduleView from "./ClassScheduleView";
import LandingPage from "./LandingPage";
import RegisterModal from "./RegisterModal";
import AdminPanel from "./AdminPanel";

export type UserSession = {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
} | null;

export type AppView =
  | "calendar"
  | "today"
  | "week"
  | "classSchedule"
  | "report"
  | "chat"
  | "admin"
  | "public";

export default function AppShell() {
  const [user, setUser] = useState<UserSession>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>("calendar");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Record<string, unknown> | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [voiceActive, setVoiceActive] = useState(false);
  const [prefillData, setPrefillData] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
        // Auto-navigate admin to admin view
        if (data.user?.role === "admin") {
          setCurrentView("admin");
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      setUser(meData.user);
      setShowLogin(false);
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCurrentView("public");
  };

  const handleCreateEvent = (date?: Date) => {
    setEditingEvent(null);
    if (date) setSelectedDate(date);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Record<string, unknown>) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleVoiceCommand = (command: string) => {
    const lower = command.toLowerCase();
    if (lower.includes("kalender") || lower.includes("calendar")) {
      setCurrentView("calendar");
    } else if (lower.includes("hari ini") || lower.includes("today")) {
      setCurrentView("today");
    } else if (lower.includes("minggu") || lower.includes("week")) {
      setCurrentView("week");
    } else if (
      lower.includes("jadwal mengajar") ||
      lower.includes("jadwal kelas") ||
      lower.includes("timetable")
    ) {
      setCurrentView("classSchedule");
    } else if (lower.includes("laporan") || lower.includes("report")) {
      setCurrentView("report");
    } else if (lower.includes("chat") || lower.includes("obrolan")) {
      setCurrentView("chat");
    } else if (lower.includes("admin")) {
      if (user?.role === "admin") {
        setCurrentView("admin");
      } else {
        alert("Hanya admin yang dapat mengakses");
      }
    } else if (lower.includes("publik") || lower.includes("public")) {
      setCurrentView("public");
    } else if (
      lower.includes("buat") ||
      lower.includes("tambah") ||
      lower.includes("jadwal baru")
    ) {
      setShowEventModal(true);
    } else if (lower.includes("login") || lower.includes("masuk")) {
      setShowLogin(true);
    } else if (lower.includes("logout") || lower.includes("keluar")) {
      handleLogout();
    } else {
      // Use as prefill for event creation
      setPrefillData({ title: command });
      setShowEventModal(true);
    }
  };

  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Memuat JadwalKu...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <LandingPage
          onLoginClick={() => setShowLogin(true)}
          onRegisterClick={() => setShowRegister(true)}
        />
        {showLogin && (
          <LoginModal
            onLogin={handleLogin}
            onClose={() => setShowLogin(false)}
          />
        )}
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onSuccess={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        )}
      </div>
    );
  }

  // Show approval pending message if user status is pending
  if (user.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
        <div className="max-w-md w-full mx-4 bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Akun Menunggu Persetujuan
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Terima kasih telah mendaftar sebagai dosen di JadwalKu. Akun Anda sedang menunggu
            persetujuan dari admin. Anda akan menerima email pemberitahuan setelah akun Anda
            disetujui.
          </p>
          <button
            onClick={async () => {
              await handleLogout();
            }}
            className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        user={user}
        currentView={currentView}
        onNavigate={navigateTo}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header
          user={user}
          currentView={currentView}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onCreateEvent={() => handleCreateEvent()}
          voiceActive={voiceActive}
          onVoiceToggle={() => setVoiceActive(!voiceActive)}
          onLogin={() => setShowLogin(true)}
        />

        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {currentView === "calendar" && (
            <CalendarView
              key={`cal-${refreshKey}`}
              user={user}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onCreateEvent={handleCreateEvent}
              onEditEvent={handleEditEvent}
              viewMode="month"
            />
          )}
          {currentView === "today" && (
            <CalendarView
              key={`today-${refreshKey}`}
              user={user}
              selectedDate={new Date()}
              onSelectDate={setSelectedDate}
              onCreateEvent={handleCreateEvent}
              onEditEvent={handleEditEvent}
              viewMode="day"
            />
          )}
          {currentView === "week" && (
            <CalendarView
              key={`week-${refreshKey}`}
              user={user}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onCreateEvent={handleCreateEvent}
              onEditEvent={handleEditEvent}
              viewMode="week"
            />
          )}
          {currentView === "classSchedule" && (
            <ClassScheduleView key={`class-${refreshKey}`} user={user} />
          )}
          {currentView === "report" && <ReportView user={user} />}
          {currentView === "chat" && <ChatBot user={user} />}
          {currentView === "admin" && user?.role === "admin" && (
            <AdminPanel key={`admin-${refreshKey}`} user={user} />
          )}
          {currentView === "public" && <PublicView />}
        </main>
      </div>

      {/* Modals */}
      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}

      {showEventModal && user && (
        <EventModal
          event={editingEvent}
          selectedDate={selectedDate}
          prefillData={prefillData}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
            setPrefillData(null);
          }}
          onSave={() => {
            setShowEventModal(false);
            setEditingEvent(null);
            setPrefillData(null);
            refresh();
          }}
        />
      )}

      {/* Voice Command */}
      {voiceActive && (
        <VoiceCommandOverlay
          onCommand={handleVoiceCommand}
          onClose={() => setVoiceActive(false)}
        />
      )}

      {/* Notifications */}
      {user && <NotificationManager key={`notif-${refreshKey}`} />}

      {/* Floating chat button when not on chat view */}
      {currentView !== "chat" && (
        <button
          onClick={() => navigateTo("chat")}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 hover:scale-110"
          title="Buka Chatbot"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
    </div>
  );
}
