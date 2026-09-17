# KindCare Authentication and Device Access

## Goal

Make sign-in secure and low-friction for both caregivers and members. A person should be able to open KindCare using the secure unlock method on their own device: Face ID, Touch ID, Android fingerprint/face unlock, or Windows Hello where available.

## Use passkeys, not biometric data

KindCare must use WebAuthn passkeys. The device performs the biometric or device-PIN verification locally; KindCare never receives, stores, or processes fingerprints, face scans, or device biometric templates.

The language in the product should be:

- “Sign in with Face ID / Touch ID” on supporting Apple devices.
- “Sign in with your device” where the operating system chooses fingerprint, face unlock, Windows Hello, or device PIN.
- “Set up a passkey on this device” during enrollment.

Do not promise a specific biometric method. The device and browser decide what is available.

## Recommended sign-in experience

### Caregiver

- Create account with email verification and a strong password or magic-link flow.
- Prompt to create a passkey immediately after the first successful sign-in.
- On future visits, show “Sign in with your device” first, with email/password or recovery as a secondary option.
- Require a fresh sign-in/passkey confirmation for sensitive actions: changing household organizer, changing contact numbers, changing payment/billing details, exporting data, or changing access roles.

### Member

- A caregiver invites the member; the member accepts on their own personal phone/tablet and creates a passkey.
- The member’s home screen can remain signed in on their personal device, with an optional short re-entry PIN after inactivity.
- Keep recovery easy but safe: a verified email/magic link and a household-organizer-assisted recovery flow. Never let an organizer silently take over the member’s account.
- Use clear language and one large primary sign-in button.

## Shared-device policy

A shared family iPad/tablet is not appropriate for biometric sign-in unless each person has their own operating-system profile. Biometrics on a shared device can accidentally open the wrong KindCare account.

For shared devices:

- Use a visible “Who is using KindCare?” account selector.
- Require a short app PIN or passkey/device verification before showing private data.
- Never treat a browser cookie alone as sufficient identity.
- Automatically lock after a short inactivity period.
- Show the active person’s name clearly on every member screen.

## Technical requirements for Cursor

- Use the WebAuthn/passkey standard through a maintained, audited library or authentication provider compatible with the chosen Supabase Auth setup.
- Register passkeys only after a verified account sign-in.
- Store public-key credential metadata only; never store biometric data or a device unlock PIN.
- Support more than one passkey per user (for example, phone and laptop) and allow a user to revoke a lost device’s passkey.
- Protect credential-management and recovery endpoints with rate limits, verified email, audit logs, and fresh authentication.
- Keep the existing Supabase authorization model: identity proves who someone is; Row Level Security still decides what their household role can access.
- Test Apple Safari, Chrome on Android, Chrome/Edge on Windows, and a no-passkey fallback.

## Acceptance criteria

1. A caregiver can enroll a passkey on their phone and later sign in using the device’s biometric/device-unlock prompt.
2. A member can enroll a passkey with large, plain-language instructions.
3. KindCare stores no fingerprints, face data, or device PINs.
4. A lost passkey can be revoked without deleting the account.
5. A shared-device flow cannot expose one household member’s private information to another user without re-authentication.
6. Password/email recovery remains available for devices that do not support passkeys.
