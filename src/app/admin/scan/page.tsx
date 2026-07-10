import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import TicketScanner from "@/components/TicketScanner";

export default async function ScanPage() {
  if (!(await isAdmin())) redirect("/admin");

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 pb-16 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="display text-klfw text-4xl">Scan tickets</h1>
        <Link
          href="/admin"
          className="label border-klfw text-klfw border-2 px-4 py-2 text-xs"
        >
          Door list
        </Link>
      </header>
      <p className="label mb-6 text-xs text-neutral-500">
        Point the camera at the guest’s QR code. Green means in, red means
        stop.
      </p>
      <TicketScanner />
    </main>
  );
}
