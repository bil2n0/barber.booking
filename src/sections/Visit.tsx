import { SHOP } from "@contracts/booking";
import { Reveal, RevealWords } from "@/components/Reveal";
import { ScissorsMark } from "@/components/Header";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Display order: Monday first
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function Visit() {
  return (
    <section id="visit" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-36">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="kicker">03 — Find the shop</p>
          <RevealWords
            as="h2"
            text="HOURS & LOCATION"
            className="font-display mt-4 block text-4xl font-semibold uppercase leading-[0.9] tracking-[-0.02em] md:text-5xl"
            stagger={0.08}
          />
          <Reveal delay={0.25}>
            <div className="mt-10 space-y-4 text-sm">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">Address</p>
                <p className="mt-1 text-base">{SHOP.address}</p>
              </div>
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">Phone</p>
                <a href={`tel:${SHOP.phone}`} className="u-link mt-1 inline-block text-base">
                  {SHOP.phone}
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <div className="border border-border">
            {ORDER.map((d) => {
              const h = SHOP.hours[d];
              const isToday = new Date().getDay() === d;
              return (
                <div
                  key={d}
                  className={`flex items-center justify-between border-b border-border px-5 py-3.5 text-sm last:border-b-0 ${
                    isToday ? "bg-accent/60" : ""
                  }`}
                >
                  <span className={isToday ? "font-semibold" : ""}>
                    {DAYS[d]}
                    {isToday && (
                      <span className="ml-2 text-[0.6rem] uppercase tracking-[0.2em] text-primary">today</span>
                    )}
                  </span>
                  <span className={h ? "tracking-[0.08em]" : "text-muted-foreground"}>
                    {h ? `${String(h.open).padStart(2, "0")}:00 — ${String(h.close).padStart(2, "0")}:00` : "Closed"}
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8">
        <Reveal>
          <div className="flex items-center gap-3">
            <ScissorsMark className="h-7 w-7 text-primary" />
            <span className="font-script text-4xl leading-none text-foreground/90">stay sharp</span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display mt-6 select-none text-[13.5vw] font-semibold uppercase leading-[0.85] tracking-[-0.02em] text-foreground/90 md:text-[8.5rem]">
            The Sharp
            <br />
            Barber
          </h2>
        </Reveal>
        <div className="rule mt-12 flex flex-col gap-3 pt-6 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {SHOP.name} — {SHOP.address}</span>
          <a href="#book" className="u-link w-fit hover:text-foreground">
            Book a chair ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
