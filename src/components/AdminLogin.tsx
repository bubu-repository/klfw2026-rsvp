"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-8">
      <div>
        <label htmlFor="password" className="label text-klfw block text-xs">
          Organizer password
        </label>
        <input
          id="password"
          className="klfw-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          autoFocus
        />
      </div>
      {error && (
        <p role="alert" className="label text-xs text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="display bg-klfw px-8 py-3 text-xl text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
