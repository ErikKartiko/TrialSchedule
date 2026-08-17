"use client";

import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";

type Props = {
  event: Record<string, unknown> | null;
  selectedDate: Date;
  prefillData: Record<string, string> | null;
  onClose: () => void;
  onSave: () => void;
};

export default function EventModal({
  event,
  selectedDate,
  prefillData,
  onClose,
  onSave,
}: Props) {
  const isEdit = !!event;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("other");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  useEffect(() => {
    if (event) {
      setTitle((event.title as string) || "");
      setDescription((event.description as string) || "");
      setLocation((event.location as string) || "");
      setCategory((event.category as string) || "other");
      setStatus((event.status as string) || "scheduled");
      setRecurrence((event.recurrence as string) || "none");
      setReminderMinutes((event.reminderMinutes as number) ?? 15);
      if (event.startTime) {
        const st = new Date(event.startTime as string);
        setStartTime(format(st, "yyyy-MM-dd'T'HH:mm"));
      }
      if (event.endTime) {
        const et = new Date(event.endTime as string);
        setEndTime(format(et, "yyyy-MM-dd'T'HH:mm"));
      }
      if (event.recurrenceEnd) {
        setRecurrenceEnd(
          format(new Date(event.recurrenceEnd as string), "yyyy-MM-dd")
        );
      }
    } else {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      setStartTime(`${dateStr}T09:00`);
      setEndTime(`${dateStr}T10:00`);
    }

    if (prefillData) {
      if (prefillData.title) setTitle(prefillData.title);
    }
  }, [event, selectedDate, prefillData]);

  function createRecognition() {
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) return null;
    const recognition = new (SR as new () => SpeechRecognition)();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;
    return recognition;
  }

  const startVoiceInput = (field: string) => {
    const recognition = createRecognition();
    if (!recognition) {
      alert("Browser Anda tidak mendukung pengenalan suara");
      return;
    }

    setIsListening(true);
    setActiveVoiceField(field);
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      switch (field) {
        case "title":
          setTitle(text);
          break;
        case "description":
          setDescription(text);
          break;
        case "location":
          setLocation(text);
          break;
        case "ai":
          handleAISuggest(text);
          break;
      }
      setIsListening(false);
      setActiveVoiceField(null);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setActiveVoiceField(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setActiveVoiceField(null);
    };

    recognition.start();
  };

  const handleAISuggest = async (text: string) => {
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.suggestion) {
        const s = data.suggestion;
        if (s.title) setTitle(s.title);
        if (s.category) setCategory(s.category);
        if (s.location) setLocation(s.location);
        if (s.recurrence) setRecurrence(s.recurrence);
        if (s.startHour && startTime) {
          const datePart = startTime.split("T")[0];
          setStartTime(`${datePart}T${s.startHour}:${s.startMin || "00"}`);
          const endH = (parseInt(s.startHour) + 1).toString().padStart(2, "0");
          setEndTime(`${datePart}T${endH}:${s.startMin || "00"}`);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Judul kegiatan harus diisi");
      return;
    }
    if (!startTime || !endTime) {
      setError("Waktu mulai dan selesai harus diisi");
      return;
    }

    setSaving(true);
    setError("");

    const body = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      recurrence,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd).toISOString() : null,
      status,
      reminderMinutes,
    };

    try {
      const url = isEdit ? `/api/events/${event!.id}` : "/api/events";
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

  const handleDelete = async () => {
    if (!event || !confirm("Hapus agenda ini?")) return;
    try {
      await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      onSave();
    } catch {
      setError("Gagal menghapus");
    }
  };

  const MicButton = ({ field }: { field: string }) => (
    <button
      type="button"
      onClick={() => startVoiceInput(field)}
      className={`p-2 rounded-lg transition-all ${
        isListening && activeVoiceField === field
          ? "bg-red-100 text-red-600 animate-pulse"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
      title="Input suara"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? "✏️ Edit Agenda" : "➕ Tambah Agenda Baru"}
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
          {/* AI Voice Assist */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-indigo-700">
                Asisten AI - Dikte dengan suara
              </span>
            </div>
            <button
              onClick={() => startVoiceInput("ai")}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                isListening && activeVoiceField === "ai"
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isListening && activeVoiceField === "ai"
                ? "🎤 Mendengarkan... (bicara sekarang)"
                : "🎤 Bicara untuk mengisi otomatis"}
            </button>
            <p className="text-xs text-indigo-600 mt-1">
              Contoh: &quot;Rapat jurusan besok jam 10 di ruang rapat&quot;
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Judul Kegiatan *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                placeholder="Mis: Rapat Jurusan, Kuliah Algoritma..."
              />
              <MicButton field="title" />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="teaching">📚 Mengajar</option>
                <option value="course">🎓 Kursus</option>
                <option value="meeting">🤝 Rapat</option>
                <option value="mentoring">👨‍🏫 Pembimbingan</option>
                <option value="research">🔬 Penelitian</option>
                <option value="other">📋 Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="scheduled">📌 Dijadwalkan</option>
                <option value="completed">✅ Selesai</option>
                <option value="cancelled">❌ Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Waktu Mulai *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Waktu Selesai *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Pengulangan
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="none">Tidak Berulang</option>
                <option value="daily">🔄 Setiap Hari</option>
                <option value="weekly">🔄 Setiap Minggu</option>
                <option value="monthly">🔄 Setiap Bulan</option>
                <option value="yearly">🔄 Setiap Tahun</option>
              </select>
            </div>
            {recurrence !== "none" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Berulang Sampai
                </label>
                <input
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lokasi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Mis: Ruang Rapat Lt.2, Lab Komputer..."
              />
              <MicButton field="location" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi
            </label>
            <div className="flex gap-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                placeholder="Detail kegiatan..."
              />
              <MicButton field="description" />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pengingat (menit sebelum)
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value={5}>5 menit</option>
              <option value={10}>10 menit</option>
              <option value={15}>15 menit</option>
              <option value={30}>30 menit</option>
              <option value={60}>1 jam</option>
              <option value={120}>2 jam</option>
              <option value={1440}>1 hari</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-2xl">
          {isEdit && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
            >
              🗑️ Hapus
            </button>
          )}
          <div className={`flex gap-2 ${isEdit ? "" : "ml-auto"}`}>
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
