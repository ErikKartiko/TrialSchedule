"use client";

import React, { useState } from "react";

type Props = {
  onLoginClick: () => void;
  onRegisterClick: () => void;
};

export default function LandingPage({ onLoginClick, onRegisterClick }: Props) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all ${
          isScrolled ? "bg-white shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">📚</div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TrialSchedule
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onLoginClick}
              className="px-6 py-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              Masuk
            </button>
            <button
              onClick={onRegisterClick}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Daftar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Kelola Jadwal Mengajar dengan Mudah
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Aplikasi manajemen jadwal mengajar terpadu untuk dosen. Sinkronisasi otomatis
            antara jadwal kelas harian, mingguan, dan kalender agenda.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onRegisterClick}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all text-lg"
            >
              Mulai Gratis
            </button>
            <button
              onClick={onLoginClick}
              className="px-8 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-colors text-lg"
            >
              Masuk ke Akun
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-800">
            Fitur Unggulan
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "📅",
                title: "Jadwal Terpadu",
                desc: "Lihat semua jadwal mengajar dalam satu tempat dengan tampilan harian, mingguan, dan bulanan",
              },
              {
                icon: "🔄",
                title: "Sinkronisasi Otomatis",
                desc: "Jadwal kelas otomatis tersinkronisasi dengan kalender agenda mingguan Anda",
              },
              {
                icon: "📊",
                title: "Laporan Komprehensif",
                desc: "Generate laporan jadwal mengajar, beban kerja, dan statistik lainnya",
              },
              {
                icon: "🤖",
                title: "Input Suara",
                desc: "Gunakan perintah suara untuk menginput jadwal dengan cepat dan akurat",
              },
              {
                icon: "📤",
                title: "Import Excel",
                desc: "Upload jadwal dari file Excel dengan template yang sudah disediakan",
              },
              {
                icon: "👥",
                title: "Admin Panel",
                desc: "Admin dapat mengelola seluruh dosen dan data di sistem dengan mudah",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-white rounded-2xl border border-slate-200 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "0ms", label: "Response Time" },
              { number: "99.9%", label: "Uptime Guarantee" },
              { number: "24/7", label: "Support" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Siap untuk Memulai?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Daftar sekarang dan mulai kelola jadwal mengajar Anda dengan lebih efisien.
            Tim admin akan menyetujui akun Anda dalam waktu singkat.
          </p>
          <button
            onClick={onRegisterClick}
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all text-lg"
          >
            Daftar Sekarang
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📚</span>
                <span className="font-bold">TrialSchedule</span>
              </div>
              <p className="text-slate-400 text-sm">
                Solusi manajemen jadwal mengajar untuk dosen
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Fitur</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Jadwal Terpadu</a></li>
                <li><a href="#" className="hover:text-white">Import Excel</a></li>
                <li><a href="#" className="hover:text-white">Admin Panel</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Bantuan</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Dokumentasi</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 TrialSchedule. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
