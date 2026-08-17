"use client";

import React, { useState } from "react";

type Props = {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onClose: () => void;
};

export default function LoginModal({ onLogin, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password harus diisi");
      return;
    }

    setLoading(true);
    setError("");
    const success = await onLogin(username, password);
    if (!success) {
      setError("Username atau password salah");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl">
            🔐
          </div>
          <h3 className="text-xl font-bold">Login Admin</h3>
          <p className="text-blue-200 text-sm mt-1">
            Masuk untuk mengelola jadwal Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="Masukkan username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="Masukkan password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "⏳ Memproses..." : "🔑 Masuk"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            Batal
          </button>

          <div className="text-center text-xs text-slate-400 mt-4 border-t pt-4">
            <p>Default login: <strong>admin</strong> / <strong>admin123</strong></p>
          </div>
        </form>
      </div>
    </div>
  );
}
