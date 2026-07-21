"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

export function TombolLogout() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logout();
          router.push("/login");
        })
      }
    >
      {pending ? "Keluar..." : "Keluar"}
    </Button>
  );
}
