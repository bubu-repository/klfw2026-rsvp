"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RsvpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      const flags = new URLSearchParams();
      if (data.existing) flags.set("existing", "1");
      if (data.emailed === "sent" || data.emailed === "dev")
        flags.set("emailed", "1");
      const qs = flags.toString();
      router.push(`/ticket/${data.ticket_hash}${qs ? `?${qs}` : ""}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-8">
      <div>
        <label htmlFor="name" className="label text-klfw block text-xs">
          Full name
        </label>
        <input
          id="name"
          className="klfw-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As on your invitation"
          maxLength={120}
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="email" className="label text-klfw block text-xs">
          Email
        </label>
        <input
          id="email"
          className="klfw-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
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
        className="display w-full bg-klfw px-8 py-4 text-2xl text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Securing your spot…" : "Get my ticket"}
      </button>
    </form>
  );
}
