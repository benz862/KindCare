"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createMoment } from "@/app/moment-actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { createClient } from "@/lib/supabase/client";
import {
  extensionForImageType,
  maxMomentBytes,
  momentBucket,
  momentObjectPath,
  normalizeImageType,
} from "@/lib/moment-storage";

export function ComposeMoment({
  householdId,
  authorId,
  size = "care",
}: {
  householdId: string;
  authorId: string;
  size?: "care" | "member";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);
    const body = String(formData.get("body") ?? "").trim();
    const file = formData.get("photo");
    let photoPath: string | undefined;

    try {
      if (file instanceof File && file.size > 0) {
        const type = normalizeImageType(file.type);
        if (!type || !extensionForImageType(type)) {
          setError("Use a JPEG, PNG, or WebP photo.");
          setPending(false);
          return;
        }
        if (file.size > maxMomentBytes) {
          setError("Keep the photo under 5 MB.");
          setPending(false);
          return;
        }
        const path = momentObjectPath(householdId, authorId, crypto.randomUUID(), type);
        if (!path) {
          setError("That photo could not be saved.");
          setPending(false);
          return;
        }
        const { error: uploadError } = await createClient().storage.from(momentBucket).upload(path, file, {
          contentType: type,
          upsert: false,
        });
        if (uploadError) {
          setError("KindCare could not save that photo. Please try again.");
          setPending(false);
          return;
        }
        photoPath = path;
      }

      const result = await createMoment({ body: body || undefined, photoPath });
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      setMessage(result.message ?? "Saved.");
      setPending(false);
      router.refresh();
    } catch {
      setError("KindCare could not save that moment. Please try again.");
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <Field label="A warm note">
        <Textarea
          name="body"
          maxLength={500}
          className={size === "member" ? "text-lg" : undefined}
          placeholder="Happy birthday, a photo from today, or a short hello."
        />
      </Field>
      <Field label="Photo (optional)" hint="Private to this household. JPEG, PNG, or WebP.">
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-navy"
        />
      </Field>
      {error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-base text-navy" role="status">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-base text-navy" role="status">
          {message}
        </p>
      ) : null}
      <Button type="submit" size={size === "member" ? "member" : "default"} disabled={pending}>
        {pending ? "Posting…" : "Add to Moments"}
      </Button>
    </form>
  );
}
