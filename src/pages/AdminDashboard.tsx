import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ADMIN_TOKEN_KEY } from "@/lib/api";
import { ScissorsMark } from "@/components/Header";
import { SERVICES, dateKey, type Appointment, type AppointmentStatus } from "@contracts/booking";

type Filter = "upcoming" | "past" | "all";

const STATUS_STYLE: Record<string, string> = {
  booked: "text-foreground",
  done: "text-muted-foreground",
  cancelled: "text-primary line-through",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem(ADMIN_TOKEN_KEY) ?? "";
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const qc = useQueryClient();
  const meQ = useQuery({
    queryKey: ["admin", "me", token],
    queryFn: () => api.me(token),
    retry: false,
    enabled: !!token,
  });

  useEffect(() => {
    if (!token || (meQ.isFetched && !meQ.data)) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      navigate("/admin", { replace: true });
    }
  }, [token, meQ.isFetched, meQ.data, navigate]);

  const today = dateKey(new Date());
  const fromDate = filter === "upcoming" ? today : undefined;
  const listQ = useQuery({
    queryKey: ["admin", "appointments", fromDate ?? "all"],
    queryFn: () => api.appointments(token, fromDate),
    enabled: !!meQ.data,
    refetchInterval: 30_000,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "appointments"] });

  const statusM = useMutation({
    mutationFn: (v: { id: number; status: AppointmentStatus }) => api.setStatus(token, v.id, v.status),
    onSuccess: invalidate,
  });
  const removeM = useMutation({
    mutationFn: (v: { id: number }) => api.remove(token, v.id),
    onSuccess: () => {
      setConfirmDelete(null);
      invalidate();
    },
  });
  const logoutM = useMutation({
    mutationFn: () => api.logout(token),
    onSettled: () => {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      navigate("/admin", { replace: true });
    },
  });

  const rows = useMemo(() => {
    const all = listQ.data ?? [];
    if (filter === "past") return all.filter((a) => a.date < today);
    if (filter === "upcoming") return all.filter((a) => a.date >= today);
    return all;
  }, [listQ.data, filter, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of rows) {
      const arr = map.get(a.date) ?? [];
      arr.push(a);
      map.set(a.date, arr);
    }
    return [...map.entries()];
  }, [rows]);

  const stats = useMemo(() => {
    const all = listQ.data ?? [];
    const upcoming = all.filter((a) => a.date >= today && a.status === "booked");
    const todayRows = all.filter((a) => a.date === today && a.status === "booked");
    return { upcoming: upcoming.length, today: todayRows.length, total: all.length };
  }, [listQ.data, today]);

  if (!meQ.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <p className="text-[0.7rem] uppercase tracking-[0.3em]">Opening the register…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <ScissorsMark className="h-6 w-6 text-primary" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
              The Sharp Barber
            </span>
            <span className="border border-border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-5 text-[0.7rem] uppercase tracking-[0.22em]">
            <span className="hidden text-muted-foreground sm:inline">{meQ.data.username}</span>
            <button
              onClick={() => logoutM.mutate()}
              className="u-link min-h-[44px] text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-px border border-border bg-border">
          {[
            ["Today", stats.today],
            ["Upcoming", stats.upcoming],
            ["Total", stats.total],
          ].map(([label, n]) => (
            <div key={label} className="bg-background px-4 py-5 md:px-6">
              <p className="font-display text-3xl font-semibold md:text-4xl">{n}</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-10 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold uppercase tracking-tight md:text-3xl">
            Appointments
          </h1>
          <div className="flex gap-1">
            {(["upcoming", "past", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                data-active={filter === f}
                className="slot !min-h-[40px] px-3 uppercase tracking-[0.14em] data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:border-foreground"
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {listQ.isError ? (
          <p className="mt-10 border border-primary/50 bg-primary/10 px-4 py-3 text-sm">
            {listQ.error instanceof Error ? listQ.error.message : "Could not load appointments."}
          </p>
        ) : listQ.isLoading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading appointments…</p>
        ) : grouped.length === 0 ? (
          <div className="mt-10 border border-border p-10 text-center">
            <span className="font-script text-4xl text-primary">all clear</span>
            <p className="mt-2 text-sm text-muted-foreground">No appointments in this view.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            {grouped.map(([date, items]) => {
              const d = new Date(`${date}T12:00:00`);
              return (
                <div key={date}>
                  <div className="flex items-baseline justify-between border-b border-foreground/40 pb-2">
                    <h2 className="font-display text-lg font-semibold uppercase tracking-tight">
                      {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h2>
                    <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                      {items.length} {items.length === 1 ? "chair" : "chairs"}
                      {date === today ? " — today" : ""}
                    </span>
                  </div>

                  {items.map((a) => {
                    const service = SERVICES.find((s) => s.id === a.serviceId);
                    const deleting = confirmDelete === a.id;
                    return (
                      <div
                        key={a.id}
                        className="grid grid-cols-[3.4rem_1fr] gap-x-4 gap-y-3 border-b border-border py-4 sm:grid-cols-[4rem_1fr_auto_auto] sm:items-center"
                      >
                        <span className="font-display text-xl font-semibold">{a.time}</span>
                        <div>
                          <p className={`text-sm font-medium ${STATUS_STYLE[a.status]}`}>
                            {a.clientName}
                            <span className="ml-2 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground no-underline">
                              {a.status}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {service?.name ?? a.serviceId} ·{" "}
                            <a href={`tel:${a.phone}`} className="u-link hover:text-foreground">
                              {a.phone}
                            </a>
                          </p>
                        </div>
                        <div className="col-span-2 flex gap-1 sm:col-span-1">
                          {a.status === "booked" && (
                            <>
                              <button
                                className="slot !min-h-[40px] px-3 text-[0.68rem] uppercase tracking-[0.12em]"
                                disabled={statusM.isPending}
                                onClick={() => statusM.mutate({ id: a.id, status: "done" })}
                              >
                                Done
                              </button>
                              <button
                                className="slot !min-h-[40px] px-3 text-[0.68rem] uppercase tracking-[0.12em]"
                                disabled={statusM.isPending}
                                onClick={() => statusM.mutate({ id: a.id, status: "cancelled" })}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {a.status !== "booked" && (
                            <button
                              className="slot !min-h-[40px] px-3 text-[0.68rem] uppercase tracking-[0.12em]"
                              disabled={statusM.isPending}
                              onClick={() => statusM.mutate({ id: a.id, status: "booked" })}
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          {deleting ? (
                            <span className="flex gap-1">
                              <button
                                className="slot !min-h-[40px] !border-primary !bg-primary px-3 text-[0.68rem] uppercase tracking-[0.12em] !text-primary-foreground"
                                disabled={removeM.isPending}
                                onClick={() => removeM.mutate({ id: a.id })}
                              >
                                Confirm delete
                              </button>
                              <button
                                className="slot !min-h-[40px] px-3 text-[0.68rem] uppercase tracking-[0.12em]"
                                onClick={() => setConfirmDelete(null)}
                              >
                                Keep
                              </button>
                            </span>
                          ) : (
                            <button
                              className="slot !min-h-[40px] px-3 text-[0.68rem] uppercase tracking-[0.12em] text-primary"
                              onClick={() => setConfirmDelete(a.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
