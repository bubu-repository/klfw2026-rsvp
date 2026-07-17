"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminControls() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function exportGuests() {
    setExporting(true);
    try {
      const pwd = prompt("Enter admin password to export:");
      if (!pwd) return;
      const res = await fetch(
        `/api/admin/export-guests?password=${encodeURIComponent(pwd)}`
      );
      if (!res.ok) {
        alert("Export failed. Check password.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "klfw_2026_guests.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={exportGuests}
        disabled={exporting}
        className="label border-klfw text-klfw border-2 px-4 py-2 text-xs disabled:opacity-50"
      >
        {exporting ? "Exporting..." : "Export XLSX"}
      </button>
      <button
        onClick={() => router.refresh()}
        className="label border-klfw text-klfw border-2 px-4 py-2 text-xs"
      >
        Refresh
      </button>
      <button
        onClick={logout}
        className="label border-2 border-neutral-400 px-4 py-2 text-xs text-neutral-500"
      >
        Log out
      </button>
    </div>
  );
}
