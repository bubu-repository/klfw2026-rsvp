import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getGuestByHash } from "@/lib/db";
import TicketQr from "@/components/TicketQr";

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ hash: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { hash } = await params;
  const { existing, emailed } = await searchParams;

  const guest = await getGuestByHash(hash);
  if (!guest) notFound();

  return (
    <main className="relative mx-auto min-h-screen max-w-md px-6 pb-20 pt-10">
      <div
        aria-hidden
        className="halftone absolute inset-x-0 top-0 h-32 [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      {existing && (
        <p className="label border-klfw text-klfw relative mb-6 border-2 px-4 py-3 text-xs">
          You had already RSVP’d with this email. Here is your existing ticket.
        </p>
      )}
      {emailed && (
        <p className="label border-klfw text-klfw relative mb-6 border-2 px-4 py-3 text-xs">
          A copy of this ticket is on its way to your email.
        </p>
      )}

      <section className="border-klfw relative border-4 bg-white">
        {/* Header lockup */}
        <header className="border-klfw flex items-center justify-between border-b-4 px-5 py-4">
          <p className="label text-klfw text-[10px] leading-tight">
            Kuala Lumpur
            <br />
            Fashion Week
            <br />
            <span className="display text-xl tracking-widest">2026</span>
          </p>
          <p className="label text-klfw text-xs">×</p>
          <p className="display text-klfw text-right text-lg leading-none">
            Cultured
            <br />
            <span className="text-xs align-middle">by</span> Todak
          </p>
        </header>

        {guest.category === "vip" && (
          <p className="display bg-black py-2 text-center text-2xl tracking-widest text-white">
            VIP
          </p>
        )}

        <div className="px-5 py-8">
          <TicketQr value={guest.ticket_hash} guestName={guest.name} />

          <h1 className="display text-klfw mt-8 text-center text-4xl break-words">
            {guest.name}
          </h1>
          <p className="label mt-2 text-center text-xs text-neutral-500">
            {guest.email}
          </p>
        </div>

        {/* Perforation */}
        <div className="border-klfw mx-5 border-t-2 border-dashed" />

        <dl className="label text-klfw grid grid-cols-2 gap-y-4 px-5 py-6 text-xs">
          <div>
            <dt className="text-neutral-500">Date</dt>
            <dd>Friday 07.08.2026</dd>
          </div>
          <div className="text-right">
            <dt className="text-neutral-500">Venue</dt>
            <dd>Level 3, Isetan KLCC</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Registration</dt>
            <dd>5.00 PM</dd>
          </div>
          <div className="text-right">
            <dt className="text-neutral-500">Runway show</dt>
            <dd>6.00 PM</dd>
          </div>
          <div>
            <dt className="text-neutral-500">After party</dt>
            <dd>
              {guest.attending_after_party
                ? "Yes · 7.00 PM"
                : "Not attending"}
            </dd>
          </div>
          {guest.company ? (
            <div className="text-right">
              <dt className="text-neutral-500">Company</dt>
              <dd className="break-words">{guest.company}</dd>
            </div>
          ) : (
            <div />
          )}
          <div>
            <dt className="text-neutral-500">Collection 1.0</dt>
            <dd>“Battlescars”</dd>
          </div>
          <div className="text-right">
            <dt className="text-neutral-500">Ticket</dt>
            <dd className="font-mono normal-case">
              {guest.ticket_hash.slice(0, 8).toUpperCase()}
            </dd>
          </div>
        </dl>

        <footer className="bg-klfw px-5 py-4">
          <div className="mb-3 flex items-center justify-center gap-5">
            <Image
              src="/brand/klfw-white.png"
              alt="Kuala Lumpur Fashion Week 2026"
              width={64}
              height={45}
            />
            <span className="label text-sm text-white">×</span>
            <Image
              src="/brand/todak-white.png"
              alt="Todak"
              width={86}
              height={36}
            />
          </div>
          <p className="label text-center text-[10px] text-white">
            Invitation only. Present this QR code at registration.
          </p>
        </footer>
      </section>

      <p className="label mt-6 text-center text-[11px] text-neutral-500">
        Save this page or download the QR code. You will need it at the door.
      </p>
      <p className="mt-4 text-center">
        <Link href="/" className="label text-klfw text-xs underline">
          Back to event
        </Link>
      </p>
    </main>
  );
}
