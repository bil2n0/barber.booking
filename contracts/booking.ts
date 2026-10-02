// Shared booking configuration. NOTE: if you change hours or service ids, mirror the change in apps-script/Code.gs

export const SHOP = {
  name: "The Sharp Barber",
  tagline: "Cut. Shave. Repeat.",
  phone: "+1 (555) 014-7788",
  address: "214 Ridgeline Ave, Old Town",
  // Weekly hours: 0 = Sunday … 6 = Saturday. null = closed.
  hours: [
    null, // Sunday — closed
    null, // Monday — closed
    { open: 9, close: 19 }, // Tuesday
    { open: 9, close: 19 }, // Wednesday
    { open: 9, close: 19 }, // Thursday
    { open: 9, close: 20 }, // Friday
    { open: 9, close: 17 }, // Saturday
  ] as ({ open: number; close: number } | null)[],
  slotMinutes: 30,
  bookableDaysAhead: 21,
} as const;

export type Service = {
  id: string;
  name: string;
  minutes: number;
  price: number;
  blurb: string;
};

export const SERVICES: Service[] = [
  { id: "cut", name: "Classic Cut", minutes: 30, price: 32, blurb: "Consultation, precision scissor work, hot-towel finish." },
  { id: "skin-fade", name: "Skin Fade", minutes: 45, price: 38, blurb: "Razor-faded gradient, crisp line-up, styled to go." },
  { id: "beard", name: "Beard Sculpt", minutes: 30, price: 24, blurb: "Shape, hot towel, straight-razor edges, beard oil." },
  { id: "shave", name: "Royal Shave", minutes: 45, price: 36, blurb: "Traditional straight-razor shave with steam towels." },
  { id: "cut-beard", name: "Cut + Beard", minutes: 60, price: 52, blurb: "The full chair — cut, fade, beard, finish." },
  { id: "junior", name: "Junior Cut", minutes: 30, price: 22, blurb: "For the young gentlemen, twelve and under." },
];

export const APPOINTMENT_STATUSES = ["booked", "done", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Generate the bookable start times ("HH:MM") for a given weekday (0=Sun). */
export function slotsForDay(weekday: number): string[] {
  const hours = SHOP.hours[weekday];
  if (!hours) return [];
  const out: string[] = [];
  const total = (hours.close - hours.open) * 60;
  for (let m = 0; m < total; m += SHOP.slotMinutes) {
    const t = hours.open * 60 + m;
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

/** Local "YYYY-MM-DD" for a Date. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type Appointment = {
  id: number;
  clientName: string;
  phone: string;
  serviceId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  status: AppointmentStatus;
  createdAt: string;
};
