"use client";

import React, { useState, useRef } from "react";

type Props = {
  onClose: () => void;
  onImported: (count: number) => void;
};

type ImportResult = {
  imported: number;
  warnings: { rowGroup: number; message: string }[];
};

export default function ClassScheduleImportModal({ onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [semester, setSemester] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    const validExt = /\.(xlsx|xls)$/i.test(f.name);
    if (!validExt) {
      setError("File harus berformat .xlsx atau .xls");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f || null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Silakan pilih file Excel terlebih dahulu");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    if (semester) formData.append("semester", semester);

    try {
      const res = await fetch("/api/class-schedules/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ imported: data.imported, warnings: data.warnings || [] });
      } else {
        setError(data.error || "Gagal mengimpor file");
        if (data.warnings) {
          setResult({ imported: 0, warnings: data.warnings });
        }
      }
    } catch {
      setError("Terjadi kesalahan saat mengunggah file");
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-bold text-slate-800">
            📤 Import Jadwal dari Excel
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
          {!result && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                <p className="font-medium mb-1">📋 Format template yang didukung:</p>
                <p>
                  Kolom: <strong>No | Waktu | Matakuliah | Tim Pengajar | Tempat</strong>
                </p>
                <p className="mt-1">
                  Kolom Waktu berisi &ldquo;Hari : ...&rdquo; dan &ldquo;Jam : HH:mm - HH:mm WIB&rdquo;.
                  Kolom Tempat berisi &ldquo;Kelas : ...&rdquo; dan &ldquo;Ruang : ...&rdquo;.
                  Beberapa pengajar bisa diisi pada baris terpisah untuk mata kuliah yang sama.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Semester (opsional)
                </label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Ganjil 2024/2025"
                />
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
                <div className="text-4xl mb-2">📊</div>
                {file ? (
                  <p className="text-sm font-medium text-indigo-700">
                    {file.name}
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-600">
                      Klik atau seret file Excel ke sini
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Format .xlsx atau .xls
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </>
          )}

          {result && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="font-bold text-green-700">
                  {result.imported} jadwal berhasil diimpor!
                </p>
              </div>

              {result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    ⚠️ Peringatan ({result.warnings.length}):
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-600">
                        Baris #{w.rowGroup}: {w.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 sm:p-6 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-2xl">
          {result ? (
            <button
              onClick={() => onImported(result.imported)}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              Selesai
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
              >
                {uploading ? "⏳ Mengunggah..." : "📤 Import Sekarang"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
