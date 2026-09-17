"use client";

import { useState } from "react";

import { sendHelpAlert, type HelpFormState } from "@/app/help-actions";
import { MemberAction } from "@/components/member/member-action";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brand } from "@/lib/copy";
import { phoneHref } from "@/lib/phone";

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

export function HelpPanel({
  contacts,
  openAlert,
}: {
  contacts: MemberContact[];
  openAlert: { createdAt: string } | null;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState<HelpFormState>({});
  const [pending, setPending] = useState(false);
  const people = contacts.filter((contact) => contact.isEmergency || contact.includeInTalk);

  async function sendAlert() {
    setPending(true);
    const result = await sendHelpAlert();
    setState(result);
    setPending(false);
    setConfirming(false);
  }

  return (
    <Card>
      <h2 className="font-serif text-3xl font-semibold text-navy">I need help</h2>
      <p className="mt-3 text-lg leading-8 text-ink/75">
        For an immediate emergency, call 911 or your local emergency number. KindCare does not
        dispatch help or watch over you.
      </p>
      <ButtonLink href="tel:911" variant="spark" size="member" className="mt-5 w-full">
        Call 911
      </ButtonLink>

      {openAlert || state.message ? (
        <div className="mt-5 rounded-2xl bg-mist px-4 py-4">
          <p className="text-lg leading-8 text-navy">
            {state.message ??
              "KindCare already told your household that you asked for help. KindCare did not call emergency services."}
          </p>
        </div>
      ) : confirming ? (
        <div className="mt-5 grid gap-3">
          <p className="text-lg leading-8 text-ink/80">
            This will send a help alert to your KindCare household. It will not call 911.
          </p>
          <MemberAction type="button" disabled={pending} onClick={() => void sendAlert()}>
            {pending ? "Sending…" : "Send a help alert"}
          </MemberAction>
          <MemberAction type="button" variant="secondary" onClick={() => setConfirming(false)}>
            Not now
          </MemberAction>
        </div>
      ) : (
        <MemberAction
          className="mt-5"
          type="button"
          variant="secondary"
          onClick={() => setConfirming(true)}
        >
          Send a help alert
        </MemberAction>
      )}

      {people.length > 0 ? (
        <ul className="mt-5 grid gap-3">
          {people.map((person) => {
            const href = person.phone ? phoneHref(person.phone) : null;
            return (
              <li key={person.id}>
                {href ? (
                  <ButtonLink href={href} variant="teal" size="member" className="w-full">
                    Call {person.name}
                  </ButtonLink>
                ) : (
                  <p className="text-lg text-navy">{person.name}</p>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}

      {state.error ? (
        <p className="mt-4 text-lg text-navy" role="status">
          {state.error}
        </p>
      ) : null}
      <p className="mt-4 text-base leading-7 text-navy/70">{brand.safety}</p>
    </Card>
  );
}
