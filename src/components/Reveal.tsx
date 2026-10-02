import { useEffect, useRef, type ReactNode } from "react";

/** Adds .revealed when the element scrolls into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Splits text into words that stagger-reveal on scroll. */
export function RevealWords({
  text,
  className,
  as: Tag = "span",
  stagger = 0.06,
  startDelay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  stagger?: number;
  startDelay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  const words = text.split(" ");
  return (
    <Tag ref={ref as never} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="reveal-word" aria-hidden="true">
          <span style={{ ["--d" as string]: `${startDelay + i * stagger}s` }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Fade+rise on scroll. */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal-fade ${className}`} style={{ ["--d" as string]: `${delay}s` }}>
      {children}
    </div>
  );
}
