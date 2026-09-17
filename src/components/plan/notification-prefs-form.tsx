"use client";

import { useActionState } from "react";

import { updateNotificationPrefs, type NoticeFormState } from "@/app/notice-actions";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/copy";

const initial: NoticeFormState = {};

export function NotificationPrefsForm({
  notifyInApp,
  notifyEmail,
}: {
  notifyInApp: boolean;
  notifyEmail: boolean;
}) {
  const [state, action, pending] = useActionState(updateNotificationPrefs, initial);

  return (
    <form action={action} className="grid gap-4">
      <label className="flex items-center gap-3 text-sm font-normal text-ink">
        <input defaultChecked={notifyInApp} name="notifyInApp" type="checkbox" />
        Show notices in KindCare
      </label>
      <label className="grid gap-2 text-sm font-normal text-ink">
        <span className="flex items-center gap-3">
          <input defaultChecked={notifyEmail} name="notifyEmail" type="checkbox" />
          Email notices
        </span>
        <span className="text-navy/70">
          KindCare stores this preference and does not send email yet. Household mailboxes
          are on iCloud at {brand.supportEmail}, {brand.infoEmail}, and {brand.billingEmail}.
        </span>
      </label>
      {state.error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
