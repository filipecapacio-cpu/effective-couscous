"use client";

import { useTransition } from "react";
import { toggleCoupon } from "@/app/actions/admin";

export default function ToggleCouponButton({ couponId, active }: { couponId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await toggleCoupon(couponId, !active);
        })
      }
      disabled={pending}
      className="text-xs font-mono uppercase tracking-[0.06em] underline underline-offset-2 disabled:opacity-50"
    >
      {active ? "Desativar" : "Ativar"}
    </button>
  );
}
