"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelOrder } from "@/app/market-actions";

export function CancelOrder({ reference, t }: { reference: string; t: { cancel: string; confirmCancel: string; error: string } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="tfs-btn tfs-btn--secondary"
        disabled={busy}
        onClick={async () => {
          if (!window.confirm(t.confirmCancel)) return;
          setBusy(true);
          const result = await cancelOrder(reference);
          setBusy(false);
          if (result.ok) router.refresh();
          else setFailed(true);
        }}
      >
        {t.cancel}
      </button>
      {failed ? (
        <p className="tfs-error" role="alert">
          {t.error}
        </p>
      ) : null}
    </div>
  );
}
