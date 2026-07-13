"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GUEST_TITLES } from "@/lib/types";

type Variant = "light" | "vip";

// One form, two skins: blue-on-white for the public page, white-on-blue for
// the VIP page. The category rides along with the submission so the doorlist
// can tell VIPs from regular guests.
export default function RsvpForm({
  variant = "light",
}: {
  variant?: Variant;
}) {
  const router = useRouter();
  const vip = variant === "vip";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [afterParty, setAfterParty] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputCls = vip ? "klfw-input klfw-input--vip" : "klfw-input";
  const labelCls = vip
    ? "label block text-xs text-white"
    : "label text-klfw block text-xs";
  const errorCls = vip
    ? "label text-xs text-red-200"
    : "label text-xs text-red-600";

  function toggleCls(selected: boolean): string {
    if (vip) {
      return selected
        ? "bg-white text-klfw"
        : "border-2 border-white/70 text-white";
    }
    return selected
      ? "bg-klfw text-white"
      : "border-klfw text-klfw border-2";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (afterParty === null) {
      setError("Please tell us if you are joining the after party.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          title,
          attending_after_party: afterParty,
          category: vip ? "vip" : "regular",
        }),
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
    <form onSubmit={onSubmit} className="max-w-md space-y-7">
      <div>
        <label htmlFor="name" className={labelCls}>
          Full name
        </label>
        <input
          id="name"
          className={inputCls}
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
        <label htmlFor="email" className={labelCls}>
          Email
        </label>
        <input
          id="email"
          className={inputCls}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled={loading}
        />
      </div>
      <div>
        <label htmlFor="phone" className={labelCls}>
          Phone number
        </label>
        <input
          id="phone"
          className={inputCls}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 012 345 6789"
          maxLength={24}
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-5">
        <div>
          <label htmlFor="company" className={labelCls}>
            Company
          </label>
          <input
            id="company"
            className={inputCls}
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Your company"
            maxLength={120}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="title" className={labelCls}>
            Title
          </label>
          <select
            id="title"
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          >
            <option value="" disabled>
              Select your title
            </option>
            {GUEST_TITLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>
          After party — ft. Juju · 7.00–10.00 PM · Level 3, Isetan KLCC
        </legend>
        <p
          className={`label mt-1 text-[10px] ${
            vip ? "text-white/70" : "text-neutral-500"
          }`}
        >
          Are you joining us after the runway show?
        </p>
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            onClick={() => setAfterParty(true)}
            aria-pressed={afterParty === true}
            disabled={loading}
            className={`label px-5 py-3 text-xs transition-opacity hover:opacity-90 ${toggleCls(
              afterParty === true
            )}`}
          >
            Yes, I&rsquo;m in
          </button>
          <button
            type="button"
            onClick={() => setAfterParty(false)}
            aria-pressed={afterParty === false}
            disabled={loading}
            className={`label px-5 py-3 text-xs transition-opacity hover:opacity-90 ${toggleCls(
              afterParty === false
            )}`}
          >
            No, runway only
          </button>
        </div>
      </fieldset>

      {error && (
        <p role="alert" className={errorCls}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`display w-full px-8 py-4 text-2xl transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto ${
          vip ? "bg-black text-white" : "bg-klfw text-white"
        }`}
      >
        {loading ? "Securing your spot…" : "Get my ticket"}
      </button>
    </form>
  );
}
