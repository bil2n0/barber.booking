import { SERVICES } from "@contracts/booking";
import { Reveal, RevealWords } from "@/components/Reveal";

export default function Services({ onBook }: { onBook: (serviceId: string) => void }) {
  return (
    <section id="services" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-36">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
        <div>
          <p className="kicker">01 — The menu</p>
          <RevealWords
            as="h2"
            text="SERVICES & PRICES"
            className="font-display mt-4 block text-4xl font-semibold uppercase leading-[0.9] tracking-[-0.02em] md:text-5xl md:sticky md:top-28"
            stagger={0.08}
          />
        </div>

        <div>
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.05}>
              <div className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-x-4 border-t border-border py-6 transition-colors last:border-b hover:bg-accent/40 sm:grid-cols-[3rem_auto_1fr_auto_auto] sm:gap-x-6">
                <span className="text-[0.7rem] tracking-[0.2em] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl font-medium uppercase tracking-tight sm:text-3xl">
                  {s.name}
                </h3>
                <p className="col-span-3 mt-1 text-sm leading-relaxed text-muted-foreground sm:col-span-1 sm:col-start-3 sm:mt-0">
                  {s.blurb}
                </p>
                <span className="col-start-2 row-start-1 text-right text-sm tracking-[0.1em] text-foreground sm:col-start-4 sm:row-auto">
                  ${s.price}
                  <span className="ml-2 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.minutes} min
                  </span>
                </span>
                <button
                  onClick={() => onBook(s.id)}
                  className="col-start-3 row-start-1 min-h-[44px] text-right text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary opacity-100 transition-all hover:text-foreground sm:col-start-5 sm:row-auto sm:opacity-0 sm:group-hover:opacity-100"
                >
                  Book →
                </button>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.2}>
            <p className="mt-6 text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
              Every service ends with a hot towel and a straight-razor neckline.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
