"use client";

export function AddToHomeCard() {
  return (
    <section className="rounded-[2rem] border border-navy/10 bg-white p-6 shadow-sm">
      <h2 className="font-serif text-3xl font-semibold text-navy">Add KindCare to your Home Screen</h2>
      <p className="mt-3 text-lg leading-8 text-ink/75">
        After you do this, tap the KindCare icon like any other app. Use Face ID or your device
        unlock. KindCare never sees your face, fingerprint, or PIN.
      </p>
      <ol className="mt-5 grid gap-3 text-lg leading-8 text-ink/80">
        <li>
          <strong>iPhone:</strong> tap Share, then Add to Home Screen.
        </li>
        <li>
          <strong>Android:</strong> tap the browser menu, then Add to Home screen or Install app.
        </li>
      </ol>
    </section>
  );
}
