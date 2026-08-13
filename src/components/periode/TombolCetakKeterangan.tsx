"use client";

import { Button } from "@/components/ui/Button";

export function TombolCetakKeterangan() {
  return (
    <Button onClick={() => window.print()} className="w-auto px-6 print:hidden">
      Cetak Surat Keterangan
    </Button>
  );
}
