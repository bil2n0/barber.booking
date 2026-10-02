import { useEffect, useState } from "react";
import { Link } from "react-router";
import { SHOP } from "@contracts/booking";

function ScissorsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden="true">
      <circle cx="7" cy="8.5" r="3.4" />
      <circle cx="7" cy="23.5" r="3.4" />
      <path d="M10 10.8 27 21.5M10 21.2 27 10.5" strokeLinecap="round" />
    </svg>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-background/85 backdrop-blur-md border-b border-border" : ""
      }`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <ScissorsMark className="h-6 w-6 text-primary" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
            The Sharp Barber
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-[0.7rem] uppercase tracking-[0.24em] md:gap-8">
          <a href="#services" className="u-link hidden text-muted-foreground hover:text-foreground sm:inline">
            Services
          </a>
          <a href="#visit" className="u-link hidden text-muted-foreground hover:text-foreground sm:inline">
            Visit
          </a>
          <Link to="/admin" className="u-link text-muted-foreground hover:text-foreground">
            Barber Login
          </Link>
          <a
            href="#book"
            className="inline-flex min-h-[44px] items-center bg-primary px-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Book a chair
          </a>
        </nav>
      </div>
    </header>
  );
}

export function OpenBadge() {
  const now = new Date();
  const h = SHOP.hours[now.getDay()];
  const open = !!h && now.getHours() + now.getMinutes() / 60 >= h.open && now.getHours() + now.getMinutes() / 60 < h.close;
  return (
    <span className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground">
      <span
        className={`h-1.5 w-1.5 rounded-full ${open ? "open-dot bg-primary" : "bg-muted-foreground"}`}
      />
      {open ? "Open now — walk-ins welcome" : "Currently closed — book ahead"}
    </span>
  );
}

export { ScissorsMark };
