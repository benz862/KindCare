const allowedTypes: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

export const maxVoiceBytes = 10 * 1024 * 1024;
export const maxVoiceSeconds = 180;
export const voiceBucket = "voice-notes";

export function preferredRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/mpeg")) return "audio/mpeg";
  return "";
}

export function normalizeAudioType(type: string) {
  const base = type.split(";")[0]?.trim().toLowerCase() ?? "";
  return allowedTypes[base] ? base : "";
}

export function extensionForAudioType(type: string) {
  return allowedTypes[normalizeAudioType(type)] ?? "";
}

export function voiceObjectPath(patientId: string, noteId: string, type: string) {
  const extension = extensionForAudioType(type);
  if (!extension) return null;
  return `${patientId}/${noteId}.${extension}`;
}
