"use client";

import React, { useState, useEffect, useRef } from "react";

type Props = {
  onCommand: (command: string) => void;
  onClose: () => void;
};

const commandExamples = [
  { cmd: "Kalender", desc: "Buka tampilan kalender" },
  { cmd: "Hari ini", desc: "Lihat agenda hari ini" },
  { cmd: "Minggu ini", desc: "Lihat agenda minggu ini" },
  { cmd: "Jadwal mengajar", desc: "Buka jadwal mengajar kelas" },
  { cmd: "Laporan", desc: "Buka halaman laporan" },
  { cmd: "Chat", desc: "Buka asisten AI" },
  { cmd: "Buat jadwal baru", desc: "Tambah agenda baru" },
  { cmd: "Login / Masuk", desc: "Masuk ke akun admin" },
  { cmd: "Logout / Keluar", desc: "Keluar dari akun" },
];

export default function VoiceCommandOverlay({ onCommand, onClose }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "error">("idle");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SR) {
      setStatus("error");
      return;
    }

    const recognition = new (SR as new () => SpeechRecognition)();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const current = e.results[e.results.length - 1];
      setTranscript(current[0].transcript);

      if (current.isFinal) {
        setStatus("processing");
        setTimeout(() => {
          onCommand(current[0].transcript);
          onClose();
        }, 500);
      }
    };

    recognition.onerror = () => {
      setStatus("error");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === "listening") {
        setStatus("idle");
      }
    };

    recognition.start();
    setIsListening(true);
    setStatus("listening");
    setTranscript("");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus("idle");
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h3 className="text-xl font-bold mb-1">🎤 Perintah Suara</h3>
          <p className="text-purple-200 text-sm">
            Bicara untuk menavigasi atau membuat jadwal
          </p>
        </div>

        {/* Microphone area */}
        <div className="p-8 text-center">
          {/* Pulse ring animation */}
          <div className="relative inline-block mb-6">
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" style={{ transform: "scale(1.5)" }} />
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-10" style={{ transform: "scale(2)", animationDelay: "0.3s" }} />
              </>
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all duration-300 ${
                isListening
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/50 scale-110"
                  : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg hover:scale-105"
              }`}
            >
              {status === "processing" ? "⏳" : "🎤"}
            </button>
          </div>

          {/* Status */}
          <div className="mb-4">
            {status === "idle" && (
              <p className="text-slate-500">
                Tekan tombol mikrofon untuk mulai bicara
              </p>
            )}
            {status === "listening" && (
              <p className="text-red-600 font-medium animate-pulse">
                🔴 Mendengarkan... Bicara sekarang
              </p>
            )}
            {status === "processing" && (
              <p className="text-blue-600 font-medium">
                ⏳ Memproses perintah...
              </p>
            )}
            {status === "error" && (
              <p className="text-red-600">
                ❌ Browser tidak mendukung pengenalan suara atau izin ditolak
              </p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-slate-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-500 mb-1">Yang Anda ucapkan:</p>
              <p className="text-lg font-medium text-slate-800">
                &ldquo;{transcript}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Command examples */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 max-h-48 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
            Contoh Perintah:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {commandExamples.map((ex, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs text-slate-600 bg-white rounded-lg px-3 py-2"
              >
                <span className="text-purple-500 font-medium">
                  &ldquo;{ex.cmd}&rdquo;
                </span>
                <span className="text-slate-400">→ {ex.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
