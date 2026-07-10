"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Logout button plus a 15s auto-refresh so the RSVP table stays live
// while organizers keep the dashboard open on event day.
export default function AdminControls() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
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
