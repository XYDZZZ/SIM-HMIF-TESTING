"use client";

import { useEffect, useRef, useState } from "react";
import { prosesScan } from "@/lib/actions/absensi";
import { Button } from "@/components/ui/Button";

interface LogEntri {
  sukses: boolean;
  pesan: string;
  waktu: string;
}

const ELEMENT_ID = "area-scanner-qr";

export function ScannerQR({ id_kegiatan }: { id_kegiatan: string }) {
  const [aktif, setAktif] = useState(false);
  const [log, setLog] = useState<LogEntri[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const sedangMemprosesRef = useRef(false);

  useEffect(() => {
    if (!aktif) return;

    let dibatalkan = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (dibatalkan) return;

      const scanner = new Html5Qrcode(ELEMENT_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (kodeTerbaca) => {
            if (sedangMemprosesRef.current) return;
            sedangMemprosesRef.current = true;

            const hasil = await prosesScan(kodeTerbaca, id_kegiatan);
            setLog((prev) => [
              { sukses: hasil.sukses, pesan: hasil.pesan, waktu: new Date().toLocaleTimeString("id-ID") },
              ...prev,
            ]);

            // Jeda singkat supaya kartu yang sama tidak langsung ke-scan berkali-kali
            setTimeout(() => {
              sedangMemprosesRef.current = false;
            }, 1500);
          },
          undefined
        );
      } catch {
        setError("Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan dan koneksi memakai HTTPS.");
      }
    })();

    return () => {
      dibatalkan = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
    };
  }, [aktif, id_kegiatan]);

  return (
    <div className="space-y-4">
      {!aktif ? (
        <Button onClick={() => setAktif(true)} className="w-auto px-5">
          Buka Mode Scan
        </Button>
      ) : (
        <Button variant="ghost" onClick={() => setAktif(false)} className="w-auto px-5">
          Tutup Mode Scan
        </Button>
      )}

      {error && <p className="text-sm text-danger-500">{error}</p>}

      {aktif && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div id={ELEMENT_ID} className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900" />

          <div className="max-h-80 space-y-1.5 overflow-y-auto rounded-xl border border-ink-700 bg-ink-900/60 p-3">
            {log.length === 0 && <p className="p-2 text-sm text-paper-300">Menunggu kartu di-scan...</p>}
            {log.map((l, i) => (
              <div
                key={i}
                className={`rounded-md border px-3 py-2 text-sm ${
                  l.sukses ? "border-ok-500/40 bg-ok-500/10 text-ok-500" : "border-danger-500/40 bg-danger-500/10 text-danger-500"
                }`}
              >
                <span className="mr-2 font-display text-[10px] text-paper-300">{l.waktu}</span>
                {l.pesan}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
