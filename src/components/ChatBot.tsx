"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserSession } from "./AppShell";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type Props = {
  user: UserSession;
};

export default function ChatBot({ user }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `🤖 Halo${user ? ` ${user.fullName}` : ""}! Saya adalah **asisten penjadwalan** Anda.\n\nBeberapa hal yang bisa saya bantu:\n- 📅 Lihat jadwal (hari ini/besok/minggu/bulan)\n- ➕ Bantuan membuat jadwal baru\n- 📊 Informasi laporan\n- 🎤 Perintah suara\n\nKetik **"help"** untuk melihat semua fitur!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.response || "Maaf, terjadi kesalahan.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Maaf, terjadi kesalahan koneksi.",
          timestamp: new Date(),
        },
      ]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const startVoiceChat = () => {
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
      const text = e.results[0][0].transcript;
      setIsListening(false);
      sendMessage(text);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const quickActions = [
    { label: "📅 Jadwal Hari Ini", msg: "Lihat jadwal hari ini" },
    { label: "📆 Jadwal Besok", msg: "Lihat jadwal besok" },
    { label: "📋 Jadwal Minggu", msg: "Lihat jadwal minggu ini" },
    { label: "🏫 Jadwal Mengajar", msg: "Jadwal mengajar kelas saya" },
    { label: "❓ Bantuan", msg: "Help" },
  ];

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
        {/* Chat header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h3 className="font-bold">Asisten JadwalKu</h3>
              <p className="text-xs text-blue-200">
                AI-powered scheduling assistant
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-200">Online</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 border-b border-slate-100 flex gap-2 overflow-x-auto scrollbar-thin">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => sendMessage(action.msg)}
              className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-full text-xs font-medium transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}
              >
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                <div
                  className={`text-[10px] mt-1 ${
                    msg.role === "user" ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={startVoiceChat}
              className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="Chat dengan suara"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={isListening ? "🎤 Mendengarkan..." : "Ketik pesan atau perintah..."}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              disabled={loading}
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
