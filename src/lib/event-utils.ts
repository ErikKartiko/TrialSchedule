export function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    teaching: "#3B82F6",
    course: "#8B5CF6",
    meeting: "#EF4444",
    mentoring: "#10B981",
    research: "#F59E0B",
    other: "#6B7280",
  };
  return colors[category] || "#6B7280";
}

export function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    teaching: "Mengajar",
    course: "Kursus",
    meeting: "Rapat",
    mentoring: "Pembimbingan",
    research: "Penelitian",
    other: "Lainnya",
  };
  return labels[category] || "Lainnya";
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    scheduled: "Dijadwalkan",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return labels[status] || status;
}

export function getRecurrenceLabel(recurrence: string) {
  const labels: Record<string, string> = {
    none: "Tidak Berulang",
    daily: "Setiap Hari",
    weekly: "Setiap Minggu",
    monthly: "Setiap Bulan",
    yearly: "Setiap Tahun",
  };
  return labels[recurrence] || recurrence;
}
