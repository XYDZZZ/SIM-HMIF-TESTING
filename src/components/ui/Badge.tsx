export function Badge({
  children,
  warna = "netral",
}: {
  children: React.ReactNode;
  warna?: "netral" | "signal" | "ok" | "danger";
}) {
  const kelas = {
    netral: "border-ink-600 text-paper-300",
    signal: "border-signal-500/50 bg-signal-500/10 text-signal-400",
    ok: "border-ok-500/50 bg-ok-500/10 text-ok-500",
    danger: "border-danger-500/50 bg-danger-500/10 text-danger-500",
  }[warna];

  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-display text-[10px] uppercase tracking-[0.1em] ${kelas}`}
    >
      {children}
    </span>
  );
}
