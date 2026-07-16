import Image from "next/image";
import RsvpForm from "@/components/RsvpForm";

export default function EventPage() {
  return (
    <main className="relative mx-auto min-h-screen max-w-3xl overflow-hidden px-6 pb-20 pt-14 sm:px-12 sm:pb-24 sm:pt-20">
      {/* Blurred figure, abstracted from the poster */}
      <div
        aria-hidden
        className="blur-figure left-1/2 top-[26rem] h-[420px] w-[190px] -translate-x-1/2 bg-neutral-500/45"
      />
      <div
        aria-hidden
        className="blur-figure left-[18%] top-[22rem] h-[200px] w-[260px] -rotate-12 bg-neutral-400/40"
      />
      <div
        aria-hidden
        className="halftone absolute inset-x-0 bottom-0 h-48 [mask-image:linear-gradient(to_top,black,transparent)]"
      />

      {/* Headline block */}
      <header className="relative">
        <h1 className="display text-klfw flex flex-col gap-2 text-[clamp(2.4rem,10vw,4.9rem)] leading-none sm:gap-3">
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
          <p className="label text-klfw text-xs sm:text-sm">
            Born in esports
            <br />
            Built for culture
          </p>
          <p className="label text-klfw text-right text-xs sm:text-sm">
            Creative direction
            <br />
            by <span className="font-medium italic">Min Luna</span>
          </p>
        </div>
      </header>

      {/* Poster info columns */}
      <section className="relative mt-20 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-28">
        <p className="label text-klfw text-sm sm:text-base">
          Friday
          <br />
          07.08.2026
        </p>
        <p className="label text-klfw text-right text-sm sm:text-base">
          Collection 1.0
          <br />
          <span className="font-black">“Battlescars”</span>
        </p>
        <p className="label text-klfw text-sm sm:text-base">
          5.00 PM
          <br />
          Registration
        </p>
        <p className="label text-klfw text-right text-sm sm:text-base">
          Esplanade,
          <br />
          KLCC Park
        </p>
        <p className="label text-klfw text-sm sm:text-base">
          6.00 PM
          <br />
          Runway show
        </p>
        <p className="label text-klfw text-right text-sm sm:text-base">
          7.00 PM
          <br />
          After party <span className="font-medium italic">ft. Juju</span>
          <br />
          Level 3, Isetan KLCC
        </p>
        <p className="label text-klfw col-start-2 text-right text-sm sm:text-base">
          Invitation only
          <br />
          RSVP
        </p>
      </section>

      {/* RSVP */}
      <section id="rsvp" className="relative mt-24 sm:mt-32">
        <h2 className="display text-klfw text-6xl sm:text-7xl">RSVP</h2>
        <p className="label mt-3 max-w-md text-xs text-neutral-500 sm:text-sm">
          Invitation only. One ticket per guest. Your QR code is your entry
          pass at registration.
        </p>
        <div className="mt-8">
          <RsvpForm />
        </div>
      </section>

      {/* Footer lockup */}
      <footer className="border-klfw relative mt-24 flex items-center justify-between gap-4 border-t-2 pt-6">
        <Image
          src="/brand/klfw-blue.png"
          alt="Kuala Lumpur Fashion Week 2026"
          width={72}
          height={51}
          className="h-auto w-[64px] sm:w-[72px]"
        />
        <p className="label text-klfw text-xs sm:text-sm">×</p>
        <p className="display text-klfw text-lg sm:text-xl">
          Cultured <span className="align-middle text-xs sm:text-sm">by</span>{" "}
          Todak
        </p>
      </footer>
    </main>
  );
}
