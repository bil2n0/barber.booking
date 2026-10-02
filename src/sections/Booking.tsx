import { forwardRef, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Reveal, RevealWords } from "@/components/Reveal";
import { SERVICES, SHOP, dateKey, slotsForDay } from "@contracts/booking";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Day = { key: string; date: Date; closed: boolean };

function upcomingDays(): Day[] {
  const out: Day[] = [];
  const now = new Date();
  for (let i = 0; i < SHOP.bookableDaysAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({ key: dateKey(d), date: d, closed: !SHOP.hours[d.getDay()] });
  }
  return out;
}

const Booking = forwardRef<HTMLElement, { preselected: string | null }>(function Booking(
  { preselected },
  ref,
) {
  const days = useMemo(upcomingDays, []);
  const [serviceId, setServiceId] = useState<string>(SERVICES[0].id);
  const [day, setDay] = useState<string>(() => days.find((d) => !d.closed)?.key ?? days[0].key);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState<{ date: string; time: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselected) {
      setServiceId(preselected);
      setDone(null);
    }
  }, [preselected]);

  const selectedDay = days.find((d) => d.key === day);
  const allSlots = selectedDay && !selectedDay.closed ? slotsForDay(selectedDay.date.getDay()) : [];

  // Disable past times when booking for today
  const now = new Date();
  const isToday = day === dateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const bookedQ = useQuery({
    queryKey: ["booked", day],
    queryFn: () => api.bookedSlots(day),
    enabled: !!selectedDay && !selectedDay.closed,
  });
  const booked = new Set(bookedQ.data ?? []);

  const createM = useMutation({
    mutationFn: api.createAppointment,
    onSuccess: (res) => {
      setDone({ date: res.date, time: res.time });
      setError(null);
      bookedQ.refetch();
    },
    onError: (e) => setError(e.message),
  });

  const service = SERVICES.find((s) => s.id === serviceId)!;
  const canSubmit = !!time && name.trim().length >= 2 && phone.trim().length >= 7 && !createM.isPending;

  const submit = () => {
    if (!canSubmit || !time) return;
    setError(null);
    createM.mutate({ clientName: name.trim(), phone: phone.trim(), serviceId, date: day, time });
  };

  const reset = () => {
    setDone(null);
    setTime(null);
    setName("");
    setPhone("");
  };

  return (
    <section ref={ref} id="book" className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-36">
        <p className="kicker">02 — Reserve your chair</p>
        <RevealWords
          as="h2"
          text="BOOK AN APPOINTMENT"
          className="font-display mt-4 block max-w-3xl text-4xl font-semibold uppercase leading-[0.9] tracking-[-0.02em] md:text-6xl"
          stagger={0.07}
        />
        <Reveal delay={0.2}>
          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground">
            Choose the service, the day and the hour — then leave your phone number.{" "}
            <span className="text-foreground">The barber will call you to confirm</span> before the
            appointment is locked in.
          </p>
        </Reveal>

        {done ? (
          <Reveal>
            <div className="mt-14 max-w-xl border border-border p-8 md:p-10">
              <span className="font-script block text-5xl leading-none text-primary">Confirmed request</span>
              <h3 className="font-display mt-4 text-2xl font-semibold uppercase tracking-tight">
                {service.name}
              </h3>
              <div className="rule mt-6 space-y-3 pt-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Day</span>
                  <span className="tracking-[0.06em]">
                    {new Date(`${done.date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hour</span>
                  <span className="tracking-[0.06em]">{done.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="tracking-[0.06em]">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="tracking-[0.06em]">{phone}</span>
                </div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                Sit tight — the barber will call <span className="text-foreground">{phone}</span> shortly
                to confirm your appointment.
              </p>
              <button
                onClick={reset}
                className="mt-8 inline-flex min-h-[44px] items-center border border-foreground px-6 text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
              >
                Book another
              </button>
            </div>
          </Reveal>
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            {/* Left: service + day + hour */}
            <div className="min-w-0">
              {/* Service */}
              <Reveal delay={0.1}>
                <p className="kicker mb-4">Service</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SERVICES.map((s) => (
                    <button
                      key={s.id}
                      className="slot !flex min-h-[56px] flex-col items-start justify-center px-3 text-left"
                      data-active={serviceId === s.id}
                      onClick={() => setServiceId(s.id)}
                    >
                      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em]">
                        {s.name}
                      </span>
                      <span className="mt-0.5 text-[0.65rem] tracking-[0.12em] opacity-70">
                        ${s.price} · {s.minutes} min
                      </span>
                    </button>
                  ))}
                </div>
              </Reveal>

              {/* Day */}
              <Reveal delay={0.2}>
                <p className="kicker mb-4 mt-10">Day</p>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
                  {days.map((d) => (
                    <button
                      key={d.key}
                      disabled={d.closed}
                      data-active={day === d.key}
                      onClick={() => {
                        setDay(d.key);
                        setTime(null);
                      }}
                      className="slot !flex min-w-[64px] shrink-0 flex-col items-center justify-center px-2 py-2"
                    >
                      <span className="text-[0.62rem] uppercase tracking-[0.18em] opacity-70">
                        {WEEKDAY[d.date.getDay()]}
                      </span>
                      <span className="mt-0.5 text-base font-semibold">{d.date.getDate()}</span>
                      <span className="text-[0.62rem] uppercase tracking-[0.18em] opacity-70">
                        {MONTH[d.date.getMonth()]}
                      </span>
                    </button>
                  ))}
                </div>
              </Reveal>

              {/* Hour */}
              <Reveal delay={0.3}>
                <p className="kicker mb-4 mt-10">Hour</p>
                {selectedDay?.closed ? (
                  <p className="text-sm text-muted-foreground">Closed that day — pick another.</p>
                ) : bookedQ.isLoading ? (
                  <p className="text-sm text-muted-foreground">Checking the chair…</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {allSlots.map((t) => {
                      const [hh, mm] = t.split(":").map(Number);
                      const past = isToday && hh * 60 + mm <= nowMinutes + 15;
                      const taken = booked.has(t);
                      return (
                        <button
                          key={t}
                          className="slot"
                          disabled={past || taken}
                          data-active={time === t}
                          onClick={() => setTime(t)}
                          title={taken ? "Already booked" : past ? "Already passed" : "Available"}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Reveal>
            </div>

            {/* Right: details + summary */}
            <Reveal delay={0.35}>
              <div className="border border-border p-6 md:p-8 lg:sticky lg:top-28">
                <p className="kicker">Your details</p>
                <div className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="bk-name" className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Name
                    </label>
                    <input
                      id="bk-name"
                      className="field"
                      placeholder="Frank Morris"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="bk-phone" className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                      Phone — the barber calls this number
                    </label>
                    <input
                      id="bk-phone"
                      className="field"
                      placeholder="+1 555 014 7788"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="rule mt-8 space-y-2.5 pt-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span>{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Day</span>
                    <span>
                      {selectedDay
                        ? `${WEEKDAY[selectedDay.date.getDay()]} ${selectedDay.date.getDate()} ${MONTH[selectedDay.date.getMonth()]}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hour</span>
                    <span>{time ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">${service.price}</span>
                  </div>
                </div>

                {error && (
                  <p className="mt-5 border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-foreground">
                    {error}
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="mt-8 inline-flex min-h-[52px] w-full items-center justify-center bg-primary text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {createM.isPending ? "Booking…" : "Request appointment"}
                </button>
                <p className="mt-4 text-center text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  No payment now — pay at the chair
                </p>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
});

export default Booking;
