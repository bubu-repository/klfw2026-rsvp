import type { Metadata } from "next";
import Image from "next/image";
import RsvpForm from "@/components/RsvpForm";

export const metadata: Metadata = {
  title: "KLFW 2026 × Cultured by Todak — VIP RSVP",
  description:
    "Kuala Lumpur Fashion Week 2026. Cultured by Todak presents Collection 1.0 “Battlescars”. VIP invitation, Friday 07.08.2026, Esplanade, KLCC Park.",
};

// VIP RSVP page, served at klfw-vip.culturedbytodak.com (see src/proxy.ts).
// Inverse of the public page: white type on the brand blue, black accent
// chips, matching the VIP print invitation.
export default function VipEventPage() {
  return (
    <div className="bg-klfw min-h-screen text-white">
      <main className="relative mx-auto max-w-3xl overflow-hidden px-6 pb-20 pt-14 sm:px-12 sm:pb-24 sm:pt-20">
        {/* Blurred figure, abstracted from the poster */}
        <div
          aria-hidden
          className="blur-figure left-1/2 top-[26rem] h-[420px] w-[190px] -translate-x-1/2 bg-blue-950/60"
        />
        <div
          aria-hidden
          className="blur-figure left-[18%] top-[22rem] h-[200px] w-[260px] -rotate-12 bg-blue-900/50"
        />
        <div
          aria-hidden
          className="halftone-light absolute inset-x-0 bottom-0 h-48 [mask-image:linear-gradient(to_top,black,transparent)]"
        />

        {/* Headline block */}
        <header className="relative">
          <h1 className="display flex flex-col gap-2 text-[clamp(2.4rem,10vw,4.9rem)] leading-none text-white sm:gap-3">
            <span className="flex justify-between">
              <span>Kuala</span>
              <span>Lumpur</span>
            </span>
            <span className="flex justify-between">
              <span>Fashion</span>
              <span>Week</span>
              <span>2026</span>
            </span>
            <span className="flex justify-between">
              <span>Cultured</span>
              <span>By</span>
              <span>Todak</span>
            </span>
          </h1>
          <div className="mt-8 flex items-start justify-between gap-6 sm:mt-10">
            <p className="label text-xs text-white sm:text-sm">
              Born in esports
              <br />
              Built for culture
            </p>
            <p className="label text-right text-xs text-white sm:text-sm">
              Creative direction
              <br />
              by <span className="font-medium italic">Min Luna</span>
            </p>
          </div>
          <p className="display mt-10 inline-block bg-black px-8 py-3 text-4xl text-white sm:text-5xl">
            VIP
          </p>
        </header>

        {/* Poster info columns */}
        <section className="relative mt-16 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-24">
          <p className="label text-sm sm:text-base">
            Friday
            <br />
            07.08.2026
          </p>
          <p className="label text-right text-sm sm:text-base">
            Collection 1.0
            <br />
            <span className="font-black">“Battlescars”</span>
          </p>
          <p className="label bg-black px-3 py-2 text-sm sm:text-base">
            5.00 PM
            <br />
            Registration
          </p>
          <p className="label text-right text-sm sm:text-base">
            Esplanade,
            <br />
            KLCC Park
          </p>
          <p className="label bg-black px-3 py-2 text-sm sm:text-base">
            6.00 PM
            <br />
            Runway show
          </p>
          <p className="label text-right text-sm sm:text-base">
            7.00 PM
            <br />
            After party <span className="font-medium italic">ft. Juju</span>
            <br />
            Level 3, Isetan KLCC
          </p>
          <p className="label col-start-2 text-right text-sm sm:text-base">
            Invitation only
            <br />
            RSVP
          </p>
        </section>

        {/* RSVP */}
        <section id="rsvp" className="relative mt-24 sm:mt-32">
          <h2 className="display text-6xl text-white sm:text-7xl">
            VIP RSVP
          </h2>
          <p className="label mt-3 max-w-md text-xs text-white/70 sm:text-sm">
            VIP invitation only. One ticket per guest. Your QR code is your
            entry pass at registration.
          </p>
          <div className="mt-8">
            <RsvpForm variant="vip" />
          </div>
        </section>

        {/* Footer lockup */}
        <footer className="relative mt-24 flex items-center justify-between gap-4 border-t-2 border-white pt-6">
          <Image
            src="/brand/klfw-white.png"
            alt="Kuala Lumpur Fashion Week 2026"
            width={72}
            height={51}
            className="h-auto w-[64px] sm:w-[72px]"
          />
          <p className="label text-xs text-white sm:text-sm">×</p>
          <p className="display text-lg text-white sm:text-xl">
            Cultured <span className="align-middle text-xs sm:text-sm">by</span>{" "}
            Todak
          </p>
        </footer>
      </main>
    </div>
  );
}
