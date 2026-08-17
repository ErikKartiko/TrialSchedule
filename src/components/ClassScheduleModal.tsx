"use client";

import React, { useState, useEffect } from "react";
import { ClassScheduleData } from "./ClassScheduleView";
import { DAYS_ORDER, getDayLabel } from "@/lib/class-schedule-utils";

type Props = {
  schedule: ClassScheduleData | null;
  onClose: () => void;
  onSave: () => void;
};

export default function ClassScheduleModal({ schedule, onClose, onSave }: Props) {
  const isEdit = !!schedule;
  const [day, setDay] = useState("senin");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:40");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [className, setClassName] = useState("");
  const [room, setRoom] = useState("");
  const [teachers, setTeachers] = useState<string[]>([""]);
  const [semester, setSemester] = useState("");
  const [notes, setNotes] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (schedule) {
      setDay(schedule.day);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setCourseCode(schedule.courseCode || "");
      setCourseName(schedule.courseName);
      setClassName(schedule.className || "");
      setRoom(schedule.room || "");
      setTeachers(schedule.teachers.length ? schedule.teachers : [""]);
      setSemester(schedule.semester || "");
      setNotes(schedule.notes || "");
      setAutoSync(schedule.autoSync !== false);
    }
  }, [schedule]);

  const addTeacherField = () => setTeachers([...teachers, ""]);
  const removeTeacherField = (idx: number) =>
    setTeachers(teachers.filter((_, i) => i !== idx));
  const updateTeacher = (idx: number, value: string) => {
    const copy = [...teachers];
    copy[idx] = value;
    setTeachers(copy);
  };

  const startVoiceInput = (
    onResult: (text: string) => void
  ) => {
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) {
      alert("Browser Anda tidak mendukung pengenalan suara");
      return;
    }
    const recognition = new (SR as new () => SpeechRecognition)();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      onResult(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAIParse = (text: string) => {
    const lower = text.toLowerCase();

    // Day
    for (const d of DAYS_ORDER) {
      if (lower.includes(d)) {
        setDay(d);
        break;
      }
    }

    // Time "jam 8 sampai 10" or "08:00 - 10:00"
    const timeRangeMatch = lower.match(
      /(\d{1,2})[:.]?(\d{2})?\s*(?:-|sampai|hingga)\s*(\d{1,2})[:.]?(\d{2})?/
    );
    if (timeRangeMatch) {
      const sh = timeRangeMatch[1].padStart(2, "0");
      const sm = (timeRangeMatch[2] || "00").padStart(2, "0");
      const eh = timeRangeMatch[3].padStart(2, "0");
      const em = (timeRangeMatch[4] || "00").padStart(2, "0");
      setStartTime(`${sh}:${sm}`);
      setEndTime(`${eh}:${em}`);
    }

    // Class "kelas A"
    const classMatch = lower.match(/kelas\s+([a-z0-9]+)/i);
    if (classMatch) setClassName(classMatch[1].toUpperCase());

    // Room "ruang XYZ" / "di ruang XYZ"
    const roomMatch = text.match(/ruang(?:an)?\s+([a-zA-Z0-9.\s]+?)(?:,|$)/i);
    if (roomMatch) setRoom(roomMatch[1].trim());

    // Teacher "pengajar X" / "dosen X"
    const teacherMatch = text.match(/(?:pengajar|dosen)\s*:?\s*([a-zA-Z.\s]+?)(?:,|$)/i);
    if (teacherMatch) {
      setTeachers([teacherMatch[1].trim()]);
    }

    // Course name - use remaining/first segment as fallback
    const courseMatch = text.match(/(?:mata\s*kuliah|matkul)\s*:?\s*([a-zA-Z0-9\s]+?)(?:,|kelas|ruang|jam|$)/i);
    if (courseMatch) {
      setCourseName(courseMatch[1].trim());
    } else if (!courseName) {
      setCourseName(text.split(",")[0].trim().substring(0, 60));
    }
  };

  const handleSave = async () => {
    if (!courseName.trim()) {
      setError("Nama mata kuliah harus diisi");
      return;
    }
    if (!startTime || !endTime) {
      setError("Jam mulai dan selesai harus diisi");
      return;
    }

    setSaving(true);
    setError("");

    const body = {
      day,
      startTime,
      endTime,
      courseCode: courseCode.trim(),
      courseName: courseName.trim(),
      className: className.trim(),
      room: room.trim(),
      teachers: teachers.map((t) => t.trim()).filter(Boolean),
      semester: semester.trim(),
      notes: notes.trim(),
      autoSync,
    };

    try {
      const url = isEdit
        ? `/api/class-schedules/${schedule!.id}`
        : "/api/class-schedules";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSave();
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan");
      }
    } catch {
      setError("Terjadi kesalahan");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? "✏️ Edit Jadwal Mengajar" : "➕ Tambah Jadwal Mengajar"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Voice AI Assist */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-indigo-700">
                Isi otomatis dengan suara
              </span>
            </div>
            <button
              onClick={() => startVoiceInput(handleAIParse)}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isListening
                ? "🎤 Mendengarkan..."
                : "🎤 Bicara: contoh 'Algoritma Pemrograman, Senin jam 8 sampai 10, kelas A, ruang CDAST 2, dosen Budi'"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Day & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hari *
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              >
                {DAYS_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {getDayLabel(d)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jam Selesai *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Course */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kode MK
              </label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="KSF1102"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mata Kuliah *
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Bahasa Pemrograman"
              />
            </div>
          </div>

          {/* Class & Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kelas
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ruangan
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Ruang Kuliah CDAST 2"
              />
            </div>
          </div>

          {/* Teachers */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pengajar (Tim Pengajar)
            </label>
            <div className="space-y-2">
              {teachers.map((t, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={t}
                    onChange={(e) => updateTeacher(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Nama pengajar"
                  />
                  {teachers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeacherField(idx)}
                      className="px-3 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTeacherField}
              className="mt-2 text-xs text-indigo-600 font-medium hover:text-indigo-800"
            >
              + Tambah pengajar lain
            </button>
          </div>

          {/* Semester & Notes & AutoSync */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Semester
              </label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Ganjil 2024/2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catatan
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Opsional"
              />
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <label className="block text-sm font-medium text-slate-800">
                    Sinkronisasi Otomatis ke Kalender
                  </label>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Jadwal akan otomatis ditambahkan ke kalender agenda mingguan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoSync(!autoSync)}
                className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${
                  autoSync ? "bg-green-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    autoSync ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 sm:p-6 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
