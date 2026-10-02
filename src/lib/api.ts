import { API_URL } from "@/config";
import type { Appointment, AppointmentStatus } from "@contracts/booking";
import { demoStore } from "./demoStore";

export const ADMIN_TOKEN_KEY = "sb_admin_token";
/** True when no Google Apps Script URL is configured (data stays in this browser only). */
export const IS_DEMO = !API_URL;

async function remote<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  let res: Response;
  try {
    // text/plain keeps this a "simple" request, so the browser skips the CORS preflight
    // that Google Apps Script cannot answer.
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    throw new Error("Can't reach the booking server. Check your connection and try again.");
  }
  let json: { ok: boolean; data?: T; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error("Unexpected reply from the booking server.");
  }
  if (!json.ok) throw new Error(json.error ?? "Request failed.");
  return json.data as T;
}

type NewAppointment = { clientName: string; phone: string; serviceId: string; date: string; time: string };

export const api = {
  bookedSlots: (date: string) =>
    IS_DEMO ? demoStore.bookedSlots(date) : remote<string[]>("bookedSlots", { date }),

  createAppointment: (input: NewAppointment) =>
    IS_DEMO ? demoStore.create(input) : remote<Appointment>("create", input),

  login: (username: string, password: string) =>
    IS_DEMO
      ? demoStore.login(username, password)
      : remote<{ token: string; username: string }>("login", { username, password }),

  logout: (token: string) => (IS_DEMO ? demoStore.logout() : remote<boolean>("logout", { token })),

  me: (token: string) =>
    IS_DEMO ? demoStore.me(token) : remote<{ username: string } | null>("me", { token }),

  appointments: (token: string, fromDate?: string) =>
    IS_DEMO
      ? demoStore.appointments(token, fromDate)
      : remote<Appointment[]>("appointments", { token, fromDate }),

  setStatus: (token: string, id: number, status: AppointmentStatus) =>
    IS_DEMO ? demoStore.setStatus(token, id, status) : remote<boolean>("setStatus", { token, id, status }),

  remove: (token: string, id: number) =>
    IS_DEMO ? demoStore.remove(token, id) : remote<boolean>("remove", { token, id }),
};
