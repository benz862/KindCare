"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { maxVoiceSeconds, preferredRecorderMime } from "@/lib/voice-storage";

type VoiceRecorderProps = {
  onRecording: (file: File | null, durationSeconds: number) => void;
};

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onRecording }: VoiceRecorderProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "ready" | "unsupported">("idle");
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function startRecording() {
    const mimeType = preferredRecorderMime();
    if (!navigator.mediaDevices?.getUserMedia || !mimeType) {
      setStatus("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `kindcare-note.${mimeType === "audio/mp4" ? "m4a" : "webm"}`, {
          type: mimeType,
        });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(file));
        const duration = Math.max(1, secondsRef.current);
        setSeconds(duration);
        onRecording(file, duration);
        setStatus("ready");
      };
      recorder.start();
      secondsRef.current = 0;
      setSeconds(0);
      setStatus("recording");
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current >= maxVoiceSeconds) {
          stopRecording();
        }
      }, 1000);
    } catch {
      setStatus("unsupported");
    }
  }

  function stopRecording() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function clearRecording() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    setStatus("idle");
    onRecording(null, 0);
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-mist px-4 py-4">
      <p className="text-sm font-semibold text-navy">Voice note</p>
      {status === "unsupported" ? (
        <p className="text-sm leading-6 text-navy/75">
          This browser could not use the microphone. You can still write a text note or
          upload a short audio file.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        {status !== "recording" ? (
          <Button type="button" variant="teal" onClick={() => void startRecording()}>
            {status === "ready" ? "Record again" : "Start recording"}
          </Button>
        ) : (
          <Button type="button" variant="spark" onClick={stopRecording}>
            Stop
          </Button>
        )}
        {status === "ready" ? (
          <Button type="button" variant="ghost" onClick={clearRecording}>
            Remove recording
          </Button>
        ) : null}
        <span className="text-sm text-navy/70">
          {status === "recording" ? `Recording ${formatSeconds(seconds)}` : null}
          {status === "ready" ? `Ready · ${formatSeconds(seconds)}` : null}
          {status === "idle" ? "Up to 3 minutes" : null}
        </span>
      </div>
      {previewUrl ? (
        <audio className="w-full" controls src={previewUrl} preload="metadata">
          Your browser cannot play this recording yet.
        </audio>
      ) : null}
      <label className="grid gap-2 text-sm font-semibold text-ink">
        Or upload a short audio file
        <input
          accept="audio/webm,audio/mp4,audio/mpeg,audio/ogg,audio/wav"
          className="text-sm font-normal text-navy/80 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-navy"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (!file) {
              onRecording(null, 0);
              return;
            }
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(file));
            setStatus("ready");
            setSeconds(1);
            onRecording(file, 1);
          }}
        />
      </label>
    </div>
  );
}
