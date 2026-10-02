const ITEMS = [
  "Walk-ins welcome",
  "Hot-towel finish",
  "Straight-razor shaves",
  "Cut. Shave. Repeat.",
  "Beard sculpting",
  "Skin fades",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden border-y border-border py-4" aria-hidden="true">
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
              {item}
            </span>
            <span className="h-1 w-1 rotate-45 bg-primary" />
          </span>
        ))}
      </div>
    </div>
  );
}
