"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelRegistration } from "@/app/events-actions";

export function CancelRegistration({ id, label, confirm }: { id: string; label: string; confirm: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="text-button text-button--danger"
      disabled={busy}
      onClick={async () => {
        if (!window.confirm(confirm)) return;
        setBusy(true);
        await cancelRegistration(id);
        setBusy(false);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
