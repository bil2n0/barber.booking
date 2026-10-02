import BarberPole from "@/components/BarberPole";
import { OpenBadge } from "@/components/Header";
import { Reveal, RevealWords } from "@/components/Reveal";

export default function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      {/* Ambient glow behind the pole */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(52rem 40rem at 72% 42%, rgba(237,62,53,0.10), transparent 60%), radial-gradient(40rem 30rem at 70% 45%, rgba(255,206,163,0.07), transparent 65%)",
        }}
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-5 pb-16 pt-32 md:min-h-[100svh] md:grid-cols-2 md:px-8 md:pt-24">
        {/* Left — editorial headline stack */}
        <div className="relative z-10 order-2 md:order-1">
          <Reveal>
            <OpenBadge />
          </Reveal>
          <RevealWords
            as="h1"
            text="SHARP LOOKS,"
            className="font-display mt-6 block text-[13.5vw] font-semibold uppercase leading-[0.88] tracking-[-0.02em] sm:text-6xl md:text-7xl lg:text-[5.4rem]"
            stagger={0.08}
            startDelay={0.15}
          />
          <Reveal delay={0.45}>
            <span className="font-script block text-[16vw] leading-[0.7] text-primary sm:text-7xl md:text-8xl">
              clean cuts.
            </span>
          </Reveal>
          <Reveal delay={0.6}>
            <p className="mt-8 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
              A traditional barbershop with a modern edge. Pick your day, pick your hour — leave your
              number and the barber will call to confirm your chair.
            </p>
          </Reveal>
          <Reveal delay={0.75}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#book"
                className="inline-flex min-h-[48px] items-center bg-foreground px-7 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-background transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Book an appointment
              </a>
              <a
                href="#services"
                className="u-link inline-flex min-h-[48px] items-center text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
              >
                See the services
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.9}>
            <div className="rule mt-14 flex max-w-md items-center justify-between pt-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
              <span>Est. 2016</span>
              <span>Straight-razor certified</span>
              <span>Old Town</span>
            </div>
          </Reveal>
        </div>

        {/* Right — interactive pole */}
        <div className="relative order-1 md:order-2">
          <Reveal delay={0.2}>
            <BarberPole className="mx-auto h-[46svh] w-full max-w-[26rem] cursor-grab active:cursor-grabbing md:h-[74svh] md:max-w-none" />
          </Reveal>
          <Reveal delay={0.5}>
            <p className="kicker mt-2 text-center md:text-right">Drag the pole — it spins</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
