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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "vip", label: "VIP" },
  { key: "regular", label: "Regular" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const authed = await isAdmin();

  if (!authed) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 pt-14 sm:px-10 sm:pt-16">
        <Image
          src="/brand/klfw-blue.png"
          alt="Kuala Lumpur Fashion Week 2026"
          width={150}
          height={106}
          className="h-auto w-[120px] sm:w-[150px]"
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

  const { filter: rawFilter } = await searchParams;
  const filter: FilterKey =
    rawFilter === "vip" || rawFilter === "regular" ? rawFilter : "all";

  const guests = await listGuests();
  const checkedIn = guests.filter((g) => g.checked_in).length;
  const vips = guests.filter((g) => g.category === "vip").length;
  const afterParty = guests.filter((g) => g.attending_after_party).length;

  const visible =
    filter === "all" ? guests : guests.filter((g) => g.category === filter);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 pb-20 pt-10 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <Image
            src="/brand/klfw-blue.png"
            alt="Kuala Lumpur Fashion Week 2026"
            width={120}
            height={85}
            className="h-auto w-[100px] sm:w-[120px]"
            priority
          />
          <h1 className="display text-klfw mt-4 text-5xl sm:text-6xl">
            Door list
          </h1>
        </div>
        <AdminControls />
      </header>

      <section className="border-klfw mt-10 grid grid-cols-2 border-2 sm:grid-cols-5">
        <div className="border-klfw border-b-2 border-r-2 p-3 sm:border-b-0 sm:p-4">
          <p className="label text-[11px] text-neutral-500 sm:text-xs">RSVPs</p>
          <p className="display text-klfw text-3xl sm:text-5xl">
            {guests.length}
          </p>
        </div>
        <div className="border-klfw border-b-2 p-3 sm:border-b-0 sm:border-r-2 sm:p-4">
          <p className="label text-[11px] text-neutral-500 sm:text-xs">VIP</p>
          <p className="display text-3xl text-black sm:text-5xl">{vips}</p>
        </div>
        <div className="border-klfw border-r-2 p-3 sm:p-4">
          <p className="label text-[11px] text-neutral-500 sm:text-xs">
            After party
          </p>
          <p className="display text-klfw text-3xl sm:text-5xl">{afterParty}</p>
        </div>
        <div className="border-klfw p-3 sm:border-r-2 sm:p-4">
          <p className="label text-[11px] text-neutral-500 sm:text-xs">
            Checked in
          </p>
          <p className="display text-klfw text-3xl sm:text-5xl">{checkedIn}</p>
        </div>
        <div className="border-klfw col-span-2 border-t-2 p-3 sm:col-span-1 sm:border-t-0 sm:p-4">
          <p className="label text-[11px] text-neutral-500 sm:text-xs">
            Remaining
          </p>
          <p className="display text-klfw text-3xl sm:text-5xl">
            {guests.length - checkedIn}
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Link
          href="/admin/scan"
          className="display bg-klfw inline-block w-full px-8 py-4 text-center text-2xl text-white transition-opacity hover:opacity-90 sm:w-auto sm:text-left"
        >
          Scan tickets
        </Link>
      </div>

      {/* One doorlist, filterable by category */}
      <nav className="mt-10 flex gap-3">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin" : `/admin?filter=${f.key}`}
            className={`label border-2 px-4 py-2 text-xs ${
              filter === f.key
                ? "border-klfw bg-klfw text-white"
                : "border-klfw text-klfw"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <section className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-klfw border-b-2">
              <th className="label text-klfw px-3 py-3 text-xs">Guest</th>
              <th className="label text-klfw px-3 py-3 text-xs">Contact</th>
              <th className="label text-klfw px-3 py-3 text-xs">Type</th>
              <th className="label text-klfw px-3 py-3 text-xs">After party</th>
              <th className="label text-klfw px-3 py-3 text-xs">Ticket</th>
              <th className="label text-klfw px-3 py-3 text-xs">Status</th>
              <th className="label text-klfw px-3 py-3 text-xs">Checked in</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="label px-3 py-8 text-center text-xs text-neutral-500"
                >
                  {filter === "all"
                    ? "No RSVPs yet."
                    : `No ${filter === "vip" ? "VIP" : "regular"} RSVPs yet.`}
                </td>
              </tr>
            )}
            {visible.map((g) => (
              <tr key={g.id} className="border-b border-neutral-200">
                <td className="px-3 py-3">
                  <p className="font-bold">{g.name}</p>
                  {(g.company || g.title) && (
                    <p className="text-xs text-neutral-500">
                      {[g.title, g.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-neutral-600">
                  <p>{g.email}</p>
                  {g.phone && (
                    <p className="text-xs text-neutral-500">{g.phone}</p>
                  )}
                </td>
                <td className="px-3 py-3">
                  {g.category === "vip" ? (
                    <span className="label bg-black px-2 py-1 text-[10px] text-white">
                      VIP
                    </span>
                  ) : (
                    <span className="label border border-neutral-300 px-2 py-1 text-[10px] text-neutral-500">
                      Regular
                    </span>
                  )}
                </td>
                <td className="label px-3 py-3 text-xs">
                  {g.attending_after_party ? (
                    <span className="text-klfw">Yes</span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
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
