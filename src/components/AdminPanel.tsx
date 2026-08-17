"use client";

import React, { useState, useEffect } from "react";

type UserData = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
  nip?: string;
  role: string;
  status: string;
  createdAt: string;
};

type Props = {
  user: any;
};

export default function AdminPanel({ user }: Props) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url =
        filterStatus === "all"
          ? "/api/admin/users"
          : `/api/admin/users?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users || []);

      // Calculate stats
      if (filterStatus === "all") {
        const allRes = await fetch("/api/admin/users");
        const allData = await allRes.json();
        const allUsers = allData.users || [];
        setStats({
          total: allUsers.length,
          active: allUsers.filter((u: any) => u.status === "active").length,
          pending: allUsers.filter((u: any) => u.status === "pending").length,
          inactive: allUsers.filter((u: any) => u.status === "inactive").length,
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("Gagal memuat data pengguna");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [filterStatus]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "active" }),
      });

      if (res.ok) {
        fetchUsers();
        showToast("✅ Pengguna disetujui");
      }
    } catch (error) {
      showToast("Gagal menyetujui pengguna");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "inactive" }),
      });

      if (res.ok) {
        fetchUsers();
        showToast("⛔ Pengguna ditolak");
      }
    } catch (error) {
      showToast("Gagal menolak pengguna");
    }
  };

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus pengguna ini? Data terkait juga akan dihapus."
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        fetchUsers();
        showToast("🗑️ Pengguna dihapus");
      }
    } catch (error) {
      showToast("Gagal menghapus pengguna");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      active: { color: "bg-green-100 text-green-800", label: "Aktif" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Menunggu" },
      inactive: { color: "bg-red-100 text-red-800", label: "Nonaktif" },
    };
    const badge = badges[status] || badges.inactive;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      active: "✅",
      pending: "⏳",
      inactive: "⛔",
    };
    return icons[status] || "❓";
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          👥 Manajemen Dosen
        </h2>
        <p className="text-indigo-200 text-sm mt-1">
          Kelola akun dosen, persetujuan, dan status pengguna
        </p>
      </div>

      {/* Stats */}
      {filterStatus === "all" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-xs text-slate-600 mt-1">Total Dosen</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs text-slate-600 mt-1">Aktif</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-xs text-slate-600 mt-1">Menunggu</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-xs text-slate-600 mt-1">Nonaktif</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { label: "Semua", value: "all" },
          { label: "Menunggu Persetujuan", value: "pending" },
          { label: "Aktif", value: "active" },
          { label: "Nonaktif", value: "inactive" },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterStatus(filter.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === filter.value
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              Tidak Ada Data
            </h3>
            <p className="text-slate-500 text-sm">
              Tidak ada pengguna dengan status "{filterStatus}"
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    Nama
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    Departemen
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">
                    Terdaftar
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-slate-800">
                          {getStatusIcon(u.status)} {u.fullName}
                        </div>
                        <div className="text-xs text-slate-500">@{u.username}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.department || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(u.status)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {u.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                              title="Setujui"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleReject(u.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                              title="Tolak"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
