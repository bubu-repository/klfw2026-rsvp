import Link from "next/link";
import Image from "next/image";
import { isAdmin } from "@/lib/auth";
import { listGuests } from "@/lib/db";
import AdminLogin from "@/components/AdminLogin";
import AdminControls from "@/components/AdminControls";

function fmtKL(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const authed = await isAdmin();

  if (!authed) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 pt-16 sm:px-10">
        <Image
          src="/brand/klfw-black.png"
          alt="Kuala Lumpur Fashion Week 2026"
          width={160}
          height={113}
          priority
        />
        <h1 className="display text-klfw mt-8 text-5xl sm:text-6xl">
          Organizer access
        </h1>
        <p className="label mt-3 text-xs text-neutral-500">
          KLFW 2026 × Cultured by Todak. Door list and check-in.
        </p>
        <div className="mt-10">
          <AdminLogin />
        </div>
      </main>
    );
  }

  const guests = await listGuests();
  const checkedIn = guests.filter((g) => g.checked_in).length;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 pb-20 pt-10 sm:px-10">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Image
            src="/brand/klfw-black.png"
            alt="Kuala Lumpur Fashion Week 2026"
            width={120}
            height={85}
            priority
          />
          <h1 className="display text-klfw mt-4 text-5xl sm:text-6xl">
            Door list
          </h1>
        </div>
        <AdminControls />
      </header>

      <section className="border-klfw mt-10 grid grid-cols-3 border-2">
        <div className="border-klfw border-r-2 p-4">
          <p className="label text-xs text-neutral-500">RSVPs</p>
          <p className="display text-klfw text-4xl sm:text-5xl">
            {guests.length}
          </p>
        </div>
        <div className="border-klfw border-r-2 p-4">
          <p className="label text-xs text-neutral-500">Checked in</p>
          <p className="display text-klfw text-4xl sm:text-5xl">{checkedIn}</p>
        </div>
        <div className="p-4">
          <p className="label text-xs text-neutral-500">Remaining</p>
          <p className="display text-klfw text-4xl sm:text-5xl">
            {guests.length - checkedIn}
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Link
          href="/admin/scan"
          className="display bg-klfw inline-block px-8 py-4 text-2xl text-white transition-opacity hover:opacity-90"
        >
          Scan tickets
        </Link>
      </div>

      <section className="mt-10 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-klfw border-b-2">
              <th className="label text-klfw px-3 py-3 text-xs">Guest</th>
              <th className="label text-klfw px-3 py-3 text-xs">Email</th>
              <th className="label text-klfw px-3 py-3 text-xs">Ticket</th>
              <th className="label text-klfw px-3 py-3 text-xs">Status</th>
              <th className="label text-klfw px-3 py-3 text-xs">Checked in</th>
            </tr>
          </thead>
          <tbody>
            {guests.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="label px-3 py-8 text-center text-xs text-neutral-500"
                >
                  No RSVPs yet.
                </td>
              </tr>
            )}
            {guests.map((g) => (
              <tr key={g.id} className="border-b border-neutral-200">
                <td className="px-3 py-3 font-bold">{g.name}</td>
                <td className="px-3 py-3 text-sm text-neutral-600">
                  {g.email}
                </td>
                <td className="px-3 py-3 font-mono text-sm">
                  {g.ticket_hash.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-3 py-3">
                  {g.checked_in ? (
                    <span className="label bg-klfw px-2 py-1 text-[10px] whitespace-nowrap text-white">
                      Checked in
                    </span>
                  ) : (
                    <span className="label border border-neutral-300 px-2 py-1 text-[10px] text-neutral-500">
                      Expected
                    </span>
                  )}
                </td>
                <td className="label px-3 py-3 text-xs text-neutral-500">
                  {fmtKL(g.checked_in_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
