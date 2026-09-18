"use client";

import { useState } from "react";

import { sendHelpAlert, type HelpFormState } from "@/app/help-actions";
import { MemberAction } from "@/components/member/member-action";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brand } from "@/lib/copy";
import { helpAlertSms } from "@/lib/mail-copy";
import { phoneHref, smsHref } from "@/lib/phone";
import { formatWhen } from "@/lib/time";

export type MemberContact = {
  id: string;
  name: string;
  phone: string | null;
  relationship: string | null;
  includeInTalk: boolean;
  isEmergency: boolean;
};

export function TalkPanel({ contacts }: { contacts: MemberContact[] }) {
  const [open, setOpen] = useState(false);
  const people = contacts.filter((contact) => contact.includeInTalk && contact.phone);

  return (
    <div className="grid gap-3">
      <MemberAction type="button" onClick={() => setOpen((value) => !value)}>
        Talk to someone
      </MemberAction>
      {open ? (
        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">Talk to someone you trust</h2>
          {people.length === 0 ? (
            <p className="mt-3 text-lg leading-8 text-ink/75">
              No phone contacts are saved yet. Ask your caregiver to add someone on the People
              page.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {people.map((person) => {
                const href = person.phone ? phoneHref(person.phone) : null;
                return (
                  <li key={person.id}>
                    {href ? (
                      <ButtonLink href={href} size="member" className="w-full">
                        Call {person.name}
                      </ButtonLink>
                    ) : (
                      <p className="text-lg text-navy">{person.name}</p>
                    )}
                    {person.relationship ? (
                      <p className="mt-1 text-base text-navy/70">{person.relationship}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function HelpContactActions({
  person,
  smsBody,
  emphasize,
}: {
  person: MemberContact;
  smsBody: string;
  emphasize?: boolean;
}) {
  const call = person.phone ? phoneHref(person.phone) : null;
  const text = person.phone ? smsHref(person.phone, smsBody) : null;

  return (
    <li className="grid gap-2">
      {call ? (
        <ButtonAnchor
          href={call}
          variant={emphasize ? "teal" : "secondary"}
          size="member"
          className="w-full"
        >
          Call {person.name}
        </ButtonAnchor>
      ) : (
        <p className="text-lg text-navy">{person.name}</p>
      )}
      {text ? (
        <ButtonAnchor href={text} variant="secondary" size="member" className="w-full">
          Text {person.name}
        </ButtonAnchor>
      ) : null}
      {person.relationship ? (
        <p className="text-base text-navy/70">{person.relationship}</p>
      ) : null}
    </li>
  );
}

export function HelpPanel({
  contacts,
  openAlert,
  confirmRequired,
  memberName,
  householdName,
  timeZone,
}: {
  contacts: MemberContact[];
  openAlert: { createdAt: string; summary: string | null } | null;
  confirmRequired: boolean;
  memberName: string;
  householdName: string;
  timeZone: string;
}) {
  const [open, setOpen] = useState(Boolean(openAlert));
  const [state, setState] = useState<HelpFormState>({});
  const [pending, setPending] = useState(false);
  const people = contacts.filter((contact) => contact.isEmergency || contact.includeInTalk);
  const primary = people.find((person) => person.phone) ?? null;
  const primaryCall = primary?.phone ? phoneHref(primary.phone) : null;
  const smsBody = helpAlertSms({ memberName, householdName });
  const sentMessage = state.message ?? openAlert?.summary;
  const sentAt = state.createdAt ?? openAlert?.createdAt ?? null;
  const alertSent = Boolean(sentMessage || openAlert);

  async function sendAlert() {
    setPending(true);
    const result = await sendHelpAlert();
    setState(result);
    setPending(false);
    setOpen(true);
  }

  async function onNeedHelp() {
    if (!confirmRequired && !alertSent) {
      await sendAlert();
      return;
    }
    setOpen(true);
  }

  return (
    <div className="grid gap-3">
      {open ? null : (
        <MemberAction type="button" variant="spark" disabled={pending} onClick={() => void onNeedHelp()}>
          {pending ? "Sending…" : "I need help"}
        </MemberAction>
      )}
      {open ? (
        <Card>
          <h2 className="font-serif text-3xl font-semibold text-navy">I need help</h2>
          <p className="mt-3 text-lg leading-8 text-ink/75">
            For an immediate emergency, call 911 or your local emergency number. KindCare does not
            dispatch help or watch over you.
          </p>
          <ButtonAnchor href="tel:911" variant="spark" size="member" className="mt-5 w-full">
            Call 911
          </ButtonAnchor>

          {people.length > 0 ? (
            <>
              <p className="mt-6 text-lg leading-8 text-ink/80">People you can call or text:</p>
              <ul className="mt-3 grid gap-4">
                {people.map((person) => (
                  <HelpContactActions
                    key={person.id}
                    person={person}
                    smsBody={smsBody}
                    emphasize={person.id === primary?.id && alertSent}
                  />
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-5 text-lg leading-8 text-ink/75">
              No trusted phone contacts are saved yet. Ask your caregiver to add someone on the
              People page.
            </p>
          )}

          {alertSent ? (
            <div className="mt-5 rounded-2xl bg-mist px-4 py-4">
              <p className="text-lg leading-8 text-navy">
                {sentMessage ??
                  "KindCare told your household that you asked for help. KindCare did not call emergency services."}
              </p>
              {sentAt ? (
                <p className="mt-2 text-base text-navy/70">Sent {formatWhen(sentAt, timeZone)}.</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              <p className="text-lg leading-8 text-ink/80">
                Sending a help alert tells your KindCare household in the app. It will not call 911.
              </p>
              <MemberAction type="button" disabled={pending} onClick={() => void sendAlert()}>
                {pending ? "Sending…" : "Send a help alert"}
              </MemberAction>
            </div>
          )}

          {primary && primaryCall && alertSent ? (
            <ButtonAnchor
              href={primaryCall}
              variant="teal"
              size="member"
              className="mt-5 w-full"
            >
              Call {primary.name}
            </ButtonAnchor>
          ) : null}

          {state.error ? (
            <p className="mt-4 text-lg text-navy" role="status">
              {state.error}
            </p>
          ) : null}
          <MemberAction
            className="mt-5"
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Close
          </MemberAction>
          <p className="mt-4 text-base leading-7 text-navy/70">{brand.safety}</p>
        </Card>
      ) : (
        <p className="text-base leading-7 text-navy/70">
          For an immediate emergency, call 911 or your local emergency number.
        </p>
      )}
    </div>
  );
}
