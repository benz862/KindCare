export function friendlyAuthError(message: string | undefined) {
  const value = (message ?? "").toLowerCase();

  if (value.includes("invalid login")) {
    return "That email or password did not match. Please try again.";
  }
  if (value.includes("is invalid") || value.includes("email_address_invalid")) {
    return "Enter a real email address. Placeholder domains such as example.com are not accepted.";
  }
  if (value.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox and spam folder.";
  }
  if (value.includes("already registered") || value.includes("already been registered")) {
    return "An account with that email already exists. Sign in or reset your password.";
  }
  if (value.includes("rate limit") || value.includes("over_email_send_rate_limit")) {
    return "Please wait a moment before trying again.";
  }
  if (value.includes("same password")) {
    return "Choose a new password that is different from the current one.";
  }

  return "KindCare could not complete that request. Please try again.";
}

export function friendlyDatabaseError(message: string | undefined) {
  if (!message) return "KindCare could not save that change.";
  if (message.length > 180) return "KindCare could not save that change.";
  return message.replace(/^ERROR:\s*/i, "").replace(/\s+CONTEXT:[\s\S]*$/i, "");
}
