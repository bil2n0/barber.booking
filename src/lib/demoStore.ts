// DEMO backend: keeps everything in this browser's localStorage.
// Used only when src/config.ts has no API_URL.
import { SERVICES, slotsForDay, type Appointment, type AppointmentStatus } from "@contracts/booking";

const KEY = "sb_demo_appointments";
export const DEMO_USER = "barber";
export const DEMO_PASS = "sharp2024";
const DEMO_TOKEN = "demo-session";

const delay = () => new Promise((r) => setTimeout(r, 150));

function load(): Appointment[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Appointment[];
  } catch {
    return [];
  }
}
function save(rows: Appointment[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* storage unavailable — ignore */
  }
}
function requireToken(token: string) {
  if (token !== DEMO_TOKEN) throw new Error("Session expired — sign in again.");
}

export const demoStore = {
  async bookedSlots(date: string): Promise<string[]> {
    await delay();
    return load().filter((a) => a.date === date && a.status !== "cancelled").map((a) => a.time);
  },

  async create(input: { clientName: string; phone: string; serviceId: string; date: string; time: string }) {
    await delay();
    if (input.clientName.trim().length < 2) throw new Error("Please enter your name");
    if (!/^[+()\-.\s\d]{7,20}$/.test(input.phone.trim())) throw new Error("Please enter a valid phone number");
    if (!SERVICES.some((s) => s.id === input.serviceId)) throw new Error("Unknown service.");
    const weekday = new Date(`${input.date}T12:00:00`).getDay();
    if (!slotsForDay(weekday).includes(input.time)) throw new Error("That time is outside opening hours.");
    const rows = load();
    if (rows.some((a) => a.date === input.date && a.time === input.time && a.status !== "cancelled")) {
      throw new Error("That slot was just taken — pick another time.");
    }
    const appt: Appointment = {
      id: rows.reduce((m, a) => Math.max(m, a.id), 0) + 1,
      clientName: input.clientName.trim(),
      phone: input.phone.trim(),
      serviceId: input.serviceId,
      date: input.date,
      time: input.time,
      status: "booked",
      createdAt: new Date().toISOString(),
    };
    save([...rows, appt]);
    return appt;
  },

  async login(username: string, password: string) {
    await delay();
    if (username !== DEMO_USER || password !== DEMO_PASS) throw new Error("Wrong username or password.");
    return { token: DEMO_TOKEN, username: DEMO_USER };
  },
  async logout() {
    return true;
  },
  async me(token: string) {
    await delay();
    return token === DEMO_TOKEN ? { username: DEMO_USER } : null;
  },
  async appointments(token: string, fromDate?: string) {
    await delay();
    requireToken(token);
    const rows = load().filter((a) => !fromDate || a.date >= fromDate);
    return rows.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : fromDate ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  },
  async setStatus(token: string, id: number, status: AppointmentStatus) {
    await delay();
    requireToken(token);
    save(load().map((a) => (a.id === id ? { ...a, status } : a)));
    return true;
  },
  async remove(token: string, id: number) {
    await delay();
    requireToken(token);
    save(load().filter((a) => a.id !== id));
    return true;
  },
};
