export function phoneHref(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function smsHref(phone: string, body?: string) {
  const tel = phoneHref(phone);
  if (!tel) return null;
  const number = tel.replace(/^tel:/, "");
  if (!body) return `sms:${number}`;
  return `sms:${number}?body=${encodeURIComponent(body)}`;
}
