export function Alert({ sukses, pesan }: { sukses: boolean; pesan: string }) {
  return (
    <div
      role="alert"
      className={`rounded-md border px-3.5 py-2.5 text-sm ${
        sukses
          ? "border-ok-500/40 bg-ok-500/10 text-ok-500"
          : "border-danger-500/40 bg-danger-500/10 text-danger-500"
      }`}
    >
      {pesan}
    </div>
  );
}
