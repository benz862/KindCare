"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createVoiceNote } from "@/app/message-actions";
import { VoiceRecorder } from "@/components/messages/voice-recorder";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  extensionForAudioType,
  maxVoiceBytes,
  normalizeAudioType,
  voiceBucket,
  voiceObjectPath,
} from "@/lib/voice-storage";
import { localInputToIso } from "@/lib/time";

type Recipient = {
  id: string;
  name: string;
  roleLabel: string;
};

export function ComposeNote({
  householdId,
  recipients,
}: {
  householdId: string;
  recipients: Recipient[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [when, setWhen] = useState<"now" | "later">("now");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      let storagePath: string | undefined;
      if (file) {
        const type = normalizeAudioType(file.type);
        if (!type || !extensionForAudioType(type)) {
          setError("Use a short WebM, MP4, MP3, OGG, or WAV recording.");
          setPending(false);
          return;
        }
        if (file.size > maxVoiceBytes) {
          setError("Keep the recording under 10 MB.");
          setPending(false);
          return;
        }
        const noteId = crypto.randomUUID();
        const path = voiceObjectPath(householdId, noteId, type);
        if (!path) {
          setError("That recording could not be saved.");
          setPending(false);
          return;
        }
        const supabase = createClient();
        const { error: uploadError } = await supabase.storage.from(voiceBucket).upload(path, file, {
          contentType: type,
          upsert: false,
        });
        if (uploadError) {
          setError("KindCare could not save that recording. Please try again.");
          setPending(false);
          return;
        }
        storagePath = path;
      }

      const sendNow = when === "now";
      const deliverAt = sendNow ? undefined : localInputToIso(String(formData.get("deliverAt") ?? ""));
      const result = await createVoiceNote({
        recipientId: String(formData.get("recipientId") ?? ""),
        title: String(formData.get("title") ?? "").trim() || undefined,
        bodyText: String(formData.get("bodyText") ?? "").trim() || undefined,
        storagePath,
        durationSeconds: file ? Math.max(1, durationSeconds) : undefined,
        sendNow,
        deliverAt: deliverAt ?? undefined,
        recurrence: sendNow ? "none" : String(formData.get("recurrence") ?? "none"),
      });

      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      setMessage(result.message ?? "Saved.");
      setFile(null);
      setDurationSeconds(0);
      router.refresh();
    } catch {
      setError("KindCare could not save that note. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      <Field label="Who is this for?">
        <Select name="recipientId" required defaultValue={recipients[0]?.id}>
          {recipients.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} · {person.roleLabel}
            </option>
          ))}
        </Select>
      </Field>
      <VoiceRecorder
        onRecording={(nextFile, nextDuration) => {
          setFile(nextFile);
          setDurationSeconds(nextDuration);
        }}
      />
      <Field label="Title (optional)">
        <Input name="title" maxLength={80} placeholder="A morning hello" />
      </Field>
      <Field
        label="Written note or transcript (optional)"
        hint="A written version helps if someone cannot listen right now."
      >
        <Textarea name="bodyText" maxLength={2000} />
      </Field>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-ink">When should it arrive?</legend>
        <label className="flex items-center gap-3 text-sm font-normal text-ink">
          <input
            checked={when === "now"}
            name="when"
            type="radio"
            value="now"
            onChange={() => setWhen("now")}
          />
          Send now
        </label>
        <label className="flex items-center gap-3 text-sm font-normal text-ink">
          <input
            checked={when === "later"}
            name="when"
            type="radio"
            value="later"
            onChange={() => setWhen("later")}
          />
          Schedule for later
        </label>
      </fieldset>
      {when === "later" ? (
        <>
          <Field label="Date and time">
            <Input name="deliverAt" type="datetime-local" required={when === "later"} />
          </Field>
          <Field label="Repeat">
            <Select name="recurrence" defaultValue="none">
              <option value="none">Just once</option>
              <option value="daily">Every day</option>
              <option value="weekdays">Weekdays</option>
              <option value="weekly">Every week</option>
            </Select>
          </Field>
        </>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-navy" role="status">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || recipients.length === 0}>
        {pending ? "Saving…" : when === "now" ? "Send note" : "Schedule note"}
      </Button>
    </form>
  );
}
