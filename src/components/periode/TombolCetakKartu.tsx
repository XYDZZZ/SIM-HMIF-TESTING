"use client";

import { Button } from "@/components/ui/Button";

export function TombolCetakKartu() {
  return (
    <Button onClick={() => window.print()} className="w-auto px-6 print:hidden">
      Cetak ID Card
    </Button>
  );
}
