type EnvMap = Record<string, string | undefined>;

const OWNER_EMAIL_ENV = "KINDCARE_OWNER_EMAIL";

export function ownerEmailFromEnv(env: EnvMap = process.env) {
  const value = env[OWNER_EMAIL_ENV]?.trim().toLowerCase();
  return value || null;
}

export function isKindCareOwner(
  email: string | null | undefined,
  env: EnvMap = process.env,
) {
  const ownerEmail = ownerEmailFromEnv(env);
  if (!ownerEmail || !email) return false;
  return email.trim().toLowerCase() === ownerEmail;
}

export function isOwnerAppPath(pathname: string) {
  return pathname === "/owner" || pathname.startsWith("/owner/");
}

export function ownerSignInHref(next = "/owner") {
  return `/owner/sign-in?next=${encodeURIComponent(next)}`;
}
