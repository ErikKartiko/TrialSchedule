"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, differenceInMinutes } from "date-fns";

type EventData = {
  id: string;
  title: string;
  startTime: string;
  reminderMinutes?: number;
  category: string;
  location?: string;
};

type AppNotification = {
  id: string;
  title: string;
  message: string;
  time: Date;
  dismissed: boolean;
};

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const checkedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      window.Notification.requestPermission();
    }

    const checkEvents = async () => {
      try {
        const now = new Date();
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const res = await fetch(
          `/api/events?start=${now.toISOString()}&end=${twoHoursLater.toISOString()}`
        );
        const data = await res.json();
        const events: EventData[] = data.events || [];

        events.forEach((ev) => {
          const evStart = new Date(ev.startTime);
          const minutesUntil = differenceInMinutes(evStart, now);
          const reminder = ev.reminderMinutes || 15;
          const key = `${ev.id}-${ev.startTime}`;

          if (minutesUntil <= reminder && minutesUntil >= 0 && !checkedRef.current.has(key)) {
            checkedRef.current.add(key);

            const notif: AppNotification = {
              id: key,
              title: ev.title,
              message: `${ev.title} dimulai ${minutesUntil === 0 ? "sekarang" : `dalam ${minutesUntil} menit`}${ev.location ? ` di ${ev.location}` : ""}`,
              time: new Date(),
              dismissed: false,
            };

            setNotifications((prev) => [...prev, notif]);

            // Browser notification
            if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
              new window.Notification(`⏰ ${ev.title}`, {
                body: notif.message,
                tag: key,
              });
            }
          }
        });
      } catch {
        // ignore
      }
    };

    checkEvents();
    intervalRef.current = setInterval(checkEvents, 60000); // Check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
  };

  const activeNotifications = notifications.filter((n) => !n.dismissed);

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {activeNotifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-white rounded-xl shadow-2xl border border-blue-200 p-4 animate-slide-right"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              ⏰
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-800 text-sm">
                {notif.title}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {format(notif.time, "HH:mm")}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
