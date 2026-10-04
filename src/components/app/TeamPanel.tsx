"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { acceptInvitation, inviteMember, removeMember, revokeInvitation } from "@/app/app-actions";
import type { UiDictionary } from "@/dictionaries/ui/en";
import type { Locale } from "@/lib/i18n";

type T = UiDictionary["app"]["team"];
export type Member = { id: string; name: string; email: string; role: "owner" | "member"; isYou: boolean };
export type Invite = { id: string; email: string; created: string };

const errorText = (t: T, code: string) => t.errors[code as keyof T["errors"]] ?? t.errors.generic;

export function InviteForm({ t, locale }: { t: T; locale: Locale }) {
  const router = useRouter();
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      className="invite-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const email = String(new FormData(form).get("email") ?? "").trim();
        setBusy(true);
        const result = await inviteMember(email, locale);
        setBusy(false);
        if (result.ok) {
          setMessage({ ok: true, text: t.sent.replace("{email}", email) });
          form.reset();
          router.refresh();
        } else {
          setMessage({ ok: false, text: errorText(t, result.error) });
        }
      }}
    >
      <div className="tfs-field invite-form__field">
        <label className="tfs-label" htmlFor={`${id}-email`}>
          {t.email}
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          className="tfs-input"
          dir="ltr"
          autoComplete="off"
          required
          aria-invalid={message && !message.ok ? true : undefined}
          aria-describedby={`${id}-help`}
        />
      </div>
      <button type="submit" className="tfs-btn tfs-btn--primary" disabled={busy}>
        {busy ? t.sending : t.send}
      </button>
      <p id={`${id}-help`} className={message ? (message.ok ? "tfs-success" : "tfs-error") : "tfs-help"} role={message ? "status" : undefined}>
        {message ? message.text : t.inviteHelp}
      </p>
    </form>
  );
}

export function MemberActions({ t, member }: { t: T; member: Member }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-button text-button--danger"
      onClick={async () => {
        if (!window.confirm(t.confirmRemove.replace("{name}", member.name))) return;
        await removeMember(member.id);
        router.refresh();
      }}
    >
      {t.remove}
      <span className="visually-hidden">: {member.name}</span>
    </button>
  );
}

export function RevokeButton({ t, invite }: { t: T; invite: Invite }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-button text-button--danger"
      onClick={async () => {
        await revokeInvitation(invite.id);
        router.refresh();
      }}
    >
      {t.revoke}
      <span className="visually-hidden">: {invite.email}</span>
    </button>
  );
}

export function AcceptInvite({ t, invite, company }: { t: T; invite: Invite; company: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="banner banner--blue">
      <Icon name="users" size={20} />
      <div>
        <p>
          <strong>{t.forYouTitle}.</strong> {t.forYouText.replace("{company}", company)}
        </p>
        {error ? (
          <p className="tfs-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className="tfs-btn tfs-btn--primary tfs-btn--sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await acceptInvitation(invite.id);
          setBusy(false);
          if (result.ok) router.refresh();
          else setError(errorText(t, result.error));
        }}
      >
        {t.accept}
      </button>
    </div>
  );
}
