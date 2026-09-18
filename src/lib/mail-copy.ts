import { brand } from "@/lib/copy";

export function invitationMessage({
  householdName,
  roleLabel,
  inviteUrl,
  fromName,
}: {
  householdName: string;
  roleLabel: string;
  inviteUrl: string;
  fromName: string;
}) {
  return {
    subject: `You're invited to ${householdName} on KindCare`,
    body: `Hi,

${fromName} invited you to join ${householdName} on KindCare as a ${roleLabel}.

KindCare helps households stay connected. It is not medical advice, medical monitoring, or emergency dispatch.

Open this private link to join:
${inviteUrl}

If you did not expect this, you can ignore it.

KindCare support: ${brand.supportPhone} · ${brand.supportEmail}
`,
  };
}

export function invitationMailto({
  email,
  householdName,
  roleLabel,
  inviteUrl,
  fromName,
}: {
  email: string;
  householdName: string;
  roleLabel: string;
  inviteUrl: string;
  fromName: string;
}) {
  const { subject, body } = invitationMessage({
    householdName,
    roleLabel,
    inviteUrl,
    fromName,
  });
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function helpAlertSms({
  memberName,
  householdName,
}: {
  memberName: string;
  householdName: string;
}) {
  return `KindCare: ${memberName} asked ${householdName} for help. KindCare did not call 911. Please call them if you can.`;
}

export function helpAlertEmail({
  memberName,
  householdName,
}: {
  memberName: string;
  householdName: string;
}) {
  return {
    subject: `${memberName} asked for help on KindCare`,
    body: `${memberName} asked ${householdName} for help in KindCare.

KindCare told the household in the app. KindCare did not call 911 or dispatch emergency services, and it does not monitor emergencies.

Open KindCare Today to see the in-app alert. Call or text a trusted person if you can.

KindCare support: ${brand.supportPhone} · ${brand.supportEmail}
`,
  };
}

export function importantUpdateMessage({
  householdName,
  details,
}: {
  householdName: string;
  details: string;
}) {
  return {
    subject: `A KindCare update for ${householdName}`,
    body: `${details}

KindCare did not monitor this update and does not dispatch emergency services.

KindCare support: ${brand.supportPhone} · ${brand.supportEmail}
`,
  };
}

export const passwordResetCopy =
  "Password reset mail is sent by the sign-in service, not by KindCare. It does not include household details, medication, or help-alert content.";
