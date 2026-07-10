"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function TicketQr({
  value,
  guestName,
}: {
  value: string;
  guestName: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  function download() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klfw2026-ticket-${guestName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div ref={wrapRef} className="border-klfw border-4 bg-white p-4">
        <QRCodeCanvas
          value={value}
          size={512}
          fgColor="#1d2bf0"
          bgColor="#ffffff"
          level="M"
          style={{ width: 224, height: 224 }}
        />
      </div>
      <button
        onClick={download}
        className="display bg-klfw px-6 py-3 text-lg text-white transition-opacity hover:opacity-90"
      >
        Download QR ticket
      </button>
    </div>
  );
}
