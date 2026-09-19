"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type Turn = { role: "member" | "companion"; text: string };

export function CompanionPanel() {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [connected, setConnected] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connection = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const pendingMemberText = useRef("");

  useEffect(() => () => stop(), []);

  function stop() {
    channel.current?.close();
    connection.current?.getSenders().forEach((sender) => sender.track?.stop());
    connection.current?.close();
    connection.current = null;
    channel.current = null;
    setConnected(false);
    setWaiting(false);
  }

  async function saveVoiceTurn(memberText: string, companionText: string) {
    if (!memberText || !companionText) return;
    await fetch("/api/companion/record", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberText, companionText }) }).catch(() => undefined);
  }

  function handleEvent(event: MessageEvent<string>) {
    let data: { type?: string; transcript?: string };
    try { data = JSON.parse(event.data) as { type?: string; transcript?: string }; } catch { return; }
    if (data.type === "conversation.item.input_audio_transcription.completed" && data.transcript) {
      pendingMemberText.current = data.transcript;
      setTurns((current) => [...current, { role: "member", text: data.transcript! }]);
    }
    if ((data.type === "response.output_audio_transcript.done" || data.type === "response.audio_transcript.done") && data.transcript) {
      setTurns((current) => [...current, { role: "companion", text: data.transcript! }]);
      void saveVoiceTurn(pendingMemberText.current, data.transcript);
      pendingMemberText.current = "";
      setWaiting(false);
    }
    if (data.type === "response.done") setWaiting(false);
  }

  async function start() {
    if (connected) return stop();
    setError(null);
    try {
      const pc = new RTCPeerConnection();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pc.ontrack = (event) => { if (audio.current) audio.current.srcObject = event.streams[0]; };
      const dc = pc.createDataChannel("oai-events");
      dc.onmessage = handleEvent;
      dc.onopen = () => setConnected(true);
      dc.onclose = () => setConnected(false);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch("/api/companion/realtime", { method: "POST", headers: { "Content-Type": "application/sdp" }, body: offer.sdp });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Voice Companion could not start.");
      }
      await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
      connection.current = pc;
      channel.current = dc;
    } catch (err) {
      stop();
      setError(err instanceof Error ? err.message : "Please allow microphone access and try again.");
    }
  }

  async function sendText() {
    const text = message.trim();
    if (!text || waiting) return;
    if (!connected || channel.current?.readyState !== "open") {
      setError("Start Voice Companion first, then you can speak or type.");
      return;
    }
    setTurns((current) => [...current, { role: "member", text }]);
    pendingMemberText.current = text;
    channel.current.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } }));
    channel.current.send(JSON.stringify({ type: "response.create" }));
    setMessage("");
    setWaiting(true);
  }

  return (
    <section aria-labelledby="companion-heading">
      <audio ref={audio} autoPlay />
      <h2 id="companion-heading" className="font-serif text-3xl font-semibold text-navy">Talk with KindCare Companion</h2>
      <p className="mt-3 text-lg leading-8 text-ink/75">Have a real conversation, ask about your caregiver-entered schedule, or simply talk. KindCare Companion is an AI, not a clinician or emergency service.</p>
      <div className="mt-5 space-y-3" aria-live="polite">
        {turns.map((turn, index) => <div key={`${turn.role}-${index}`} className={turn.role === "member" ? "rounded-2xl bg-mist p-4 text-lg text-ink" : "rounded-2xl bg-navy p-4 text-lg text-cloud"}><p className="font-semibold">{turn.role === "member" ? "You" : "KindCare Companion"}</p><p className="mt-1 leading-7">{turn.text}</p></div>)}
        {waiting ? <p className="text-lg text-navy/70">KindCare Companion is responding…</p> : null}
      </div>
      <div className="mt-5 grid gap-3">
        <textarea className="min-h-24 w-full rounded-2xl border border-navy/20 bg-white p-4 text-lg text-ink outline-none focus:border-teal focus:ring-3 focus:ring-teal/20" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="After starting, you can also type a message…" />
        <div className="flex flex-wrap gap-3">
          <Button type="button" size="member" onClick={() => void start()} variant={connected ? "spark" : "teal"}>{connected ? "End voice conversation" : "Start voice conversation"}</Button>
          <Button type="button" size="member" onClick={() => void sendText()} disabled={!message.trim() || waiting}>Send message</Button>
        </div>
        {error ? <p className="text-base leading-6 text-spark">{error}</p> : null}
        <p className="text-sm leading-6 text-navy/70">For an immediate emergency, call 911 or your local emergency number.</p>
      </div>
    </section>
  );
}
