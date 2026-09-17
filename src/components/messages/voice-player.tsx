"use client";

import { useRef } from "react";

import { markVoiceNoteListened } from "@/app/message-actions";

type VoicePlayerProps = {
  title: string;
  sender: string;
  whenLabel: string;
  signedUrl: string | null;
  transcript: string | null;
  deliveryId: string | null;
  listened: boolean;
  size?: "default" | "member";
};

export function VoicePlayer({
  title,
  sender,
  whenLabel,
  signedUrl,
  transcript,
  deliveryId,
  listened,
  size = "default",
}: VoicePlayerProps) {
  const marked = useRef(listened);
  const member = size === "member";

  async function markListened() {
    if (marked.current || !deliveryId) return;
    marked.current = true;
    const formData = new FormData();
    formData.set("deliveryId", deliveryId);
    await markVoiceNoteListened(formData);
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className={member ? "font-serif text-3xl font-semibold text-navy" : "font-serif text-2xl font-semibold text-navy"}>
          {title}
        </p>
        <p className={member ? "mt-2 text-lg leading-8 text-ink/75" : "mt-1 text-sm text-navy/70"}>
          From {sender} · {whenLabel}
          {listened ? " · listened" : ""}
        </p>
      </div>
      {signedUrl ? (
        <audio
          className="w-full"
          controls
          preload="metadata"
          src={signedUrl}
          onPlay={() => {
            void markListened();
          }}
        >
          Your browser cannot play this voice note.
        </audio>
      ) : null}
      {transcript ? (
        <p className={member ? "text-lg leading-8 text-ink/80" : "leading-7 text-ink/80"}>
          {transcript}
        </p>
      ) : null}
    </div>
  );
}
