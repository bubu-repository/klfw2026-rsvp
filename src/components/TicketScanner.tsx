"use client";

import { useRef, useState } from "react";
import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import type { CheckInResult } from "@/lib/types";

type ScanState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; result: CheckInResult }
  | { kind: "error"; message: string };

function fmtKL(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketScanner() {
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const lastScan = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const paused = state.kind === "checking" || state.kind === "result";

  async function checkIn(code: string) {
    setState({ kind: "checking" });
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({
          kind: "error",
          message: data.error ?? "Check-in failed. Try again.",
        });
        navigator.vibrate?.([100, 60, 100]);
        return;
      }
      const result = data as CheckInResult;
      setState({ kind: "result", result });
      // Haptics for door staff: one buzz means in, two means stop.
      navigator.vibrate?.(
        result.status === "checked_in" ? 180 : [100, 60, 100]
      );
    } catch {
      setState({ kind: "error", message: "Network error. Try again." });
    }
  }

  function onScan(codes: IDetectedBarcode[]) {
    if (paused) return;
    const code = codes[0]?.rawValue?.trim();
    if (!code) return;
    // Ignore immediate re-reads of the same code while the guest is
    // still holding their phone up to the camera.
    const now = Date.now();
    if (lastScan.current.code === code && now - lastScan.current.at < 4000)
      return;
    lastScan.current = { code, at: now };
    void checkIn(code);
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = manualCode.trim();
    if (code) void checkIn(code);
  }

  function reset() {
    setManualCode("");
    setState({ kind: "idle" });
  }

  return (
    <div className="space-y-6">
      <div className="border-klfw relative overflow-hidden border-4 bg-black">
        <div className="aspect-square w-full">
          {!cameraError ? (
            <Scanner
              onScan={onScan}
              onError={(err) =>
                setCameraError(
                  err?.message ??
                    "Camera unavailable. Use manual entry below."
                )
              }
              paused={paused}
              formats={["qr_code"]}
              sound={false}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <p className="label text-center text-xs text-white">
                {cameraError}
              </p>
            </div>
          )}
        </div>

        {/* Result overlay: green for success, red for duplicates/invalid */}
        {(state.kind === "result" || state.kind === "error") && (
          <div
            className={`overlay-pop absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center ${
              state.kind === "result" && state.result.status === "checked_in"
                ? "bg-green-600/95"
                : "bg-red-600/95"
            }`}
          >
            {state.kind === "result" ? (
              <>
                {state.result.guest_category === "vip" && (
                  <p className="display bg-black px-6 py-2 text-3xl text-white">
                    VIP
                  </p>
                )}
                <p className="display text-4xl text-white">
                  {state.result.status === "checked_in" && "Checked in"}
                  {state.result.status === "already_checked_in" &&
                    "Already used"}
                  {state.result.status === "not_found" && "Invalid ticket"}
                </p>
                {state.result.guest_name && (
                  <p className="label text-sm text-white">
                    {state.result.guest_name}
                  </p>
                )}
                {state.result.status !== "not_found" && (
                  <p className="label text-xs text-white/80">
                    After party:{" "}
                    {state.result.after_party ? "Yes" : "No"}
                  </p>
                )}
                {state.result.status === "already_checked_in" &&
                  state.result.at && (
                    <p className="label text-xs text-white/80">
                      First scanned at {fmtKL(state.result.at)}
                    </p>
                  )}
              </>
            ) : (
              <p className="display text-3xl text-white">{state.message}</p>
            )}
            <button
              onClick={reset}
              className="label mt-4 border-2 border-white px-6 py-3 text-sm text-white"
            >
              Scan next
            </button>
          </div>
        )}

        {state.kind === "checking" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="display text-2xl text-white">Checking…</p>
          </div>
        )}
      </div>

      <form onSubmit={onManualSubmit} className="space-y-3">
        <label htmlFor="manual" className="label text-klfw block text-xs">
          Camera trouble? Enter the ticket code
        </label>
        <div className="flex gap-3">
          <input
            id="manual"
            className="klfw-input font-mono"
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="E.G. 7B052C0B"
            disabled={paused}
          />
          <button
            type="submit"
            disabled={paused || !manualCode.trim()}
            className="display bg-klfw px-6 py-2 text-lg text-white disabled:opacity-50"
          >
            Check
          </button>
        </div>
      </form>
    </div>
  );
}
