import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api, ADMIN_TOKEN_KEY, IS_DEMO } from "@/lib/api";
import { DEMO_PASS, DEMO_USER } from "@/lib/demoStore";
import { ScissorsMark } from "@/components/Header";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginM = useMutation({
    mutationFn: (v: { username: string; password: string }) => api.login(v.username, v.password),
    onSuccess: (res) => {
      localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
      navigate("/admin/dashboard");
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <ScissorsMark className="h-6 w-6 text-primary" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
              The Sharp Barber
            </span>
          </Link>
          <Link to="/" className="u-link text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <span className="font-script block text-5xl leading-none text-primary">barber only</span>
          <h1 className="font-display mt-3 text-3xl font-semibold uppercase tracking-tight">
            Admin sign-in
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Manage today's chairs, confirm bookings and clear the cancelled ones.
          </p>

          <form
            className="mt-10 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              loginM.mutate({ username, password });
            }}
          >
            <div>
              <label htmlFor="ad-user" className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                Username
              </label>
              <input
                id="ad-user"
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="ad-pass" className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
                Password
              </label>
              <input
                id="ad-pass"
                type="password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {IS_DEMO && (
              <p className="border border-border px-4 py-3 text-xs text-muted-foreground">
                Demo mode — data is stored only in this browser. Login: {DEMO_USER} / {DEMO_PASS}
              </p>
            )}

            {error && (
              <p className="border border-primary/50 bg-primary/10 px-4 py-3 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loginM.isPending || !username || !password}
              className="inline-flex min-h-[52px] w-full items-center justify-center bg-foreground text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-background transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loginM.isPending ? "Checking…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
