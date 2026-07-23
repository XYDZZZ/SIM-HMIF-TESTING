"use client";

import { useState } from "react";

export function FileField({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [namaFile, setNamaFile] = useState<string | null>(null);

  function tanganiPilihFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      setNamaFile(null);
      return;
    }
    setNamaFile(file.name);
    // HEIC/HEIF umumnya tidak bisa di-preview browser desktop -- cukup tampilkan nama file untuk itu
    if (file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  }

  return (
    <label className="block">
      <span className="block font-display text-[11px] uppercase tracking-[0.14em] text-paper-300 mb-1.5">
        {label}
      </span>
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp"
        required={required}
        onChange={tanganiPilihFile}
        className="block w-full text-sm text-paper-300 file:mr-3 file:rounded-md file:border-0
                   file:bg-signal-500 file:px-3.5 file:py-2 file:font-display file:text-[12px]
                   file:uppercase file:tracking-[0.08em] file:text-ink-950 hover:file:bg-signal-400"
      />
      {namaFile && (
        <div className="mt-2 flex items-center gap-2.5">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau bukti" className="h-14 w-14 rounded-md border border-ink-600 object-cover" />
          ) : (
            <span className="text-xs text-paper-300">📎 {namaFile}</span>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-paper-300">Format: JPG, PNG, HEIC, WEBP. Maks 8MB.</p>
    </label>
  );
}
