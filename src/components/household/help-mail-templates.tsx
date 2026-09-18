"use client";

import { CopyText } from "@/components/household/copy-text";
import { helpAlertEmail, helpAlertSms, importantUpdateMessage } from "@/lib/mail-copy";

export function HelpMailTemplates({
  memberName,
  householdName,
}: {
  memberName: string;
  householdName: string;
}) {
  const email = helpAlertEmail({ memberName, householdName });
  const update = importantUpdateMessage({
    householdName,
    details: `A short household update for ${householdName}. Add only what the person needs to know. Do not include medical advice.`,
  });

  return (
    <div className="grid gap-6">
      <div>
        <p className="font-semibold text-navy">Help text message</p>
        <p className="mt-1 text-sm leading-6 text-navy/70">
          KindCare does not send this for you. Copy it into Messages if you want to text someone.
        </p>
        <div className="mt-3">
          <CopyText value={helpAlertSms({ memberName, householdName })} label="Copy help text" />
        </div>
      </div>
      <div>
        <p className="font-semibold text-navy">Help email</p>
        <p className="mt-1 text-sm leading-6 text-navy/70">
          Send from your iCloud mailbox. KindCare does not send help email and does not include
          medical content here.
        </p>
        <div className="mt-3">
          <CopyText
            value={`Subject: ${email.subject}\n\n${email.body}`}
            label="Copy help email"
          />
        </div>
      </div>
      <div>
        <p className="font-semibold text-navy">Important update</p>
        <p className="mt-1 text-sm leading-6 text-navy/70">
          Use this wording when you write from {householdName}. Do not claim KindCare monitored
          anyone.
        </p>
        <div className="mt-3">
          <CopyText
            value={`Subject: ${update.subject}\n\n${update.body}`}
            label="Copy update email"
          />
        </div>
      </div>
    </div>
  );
}
