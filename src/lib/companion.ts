type CompanionContext = {
  memberName: string;
  timeZone: string;
  medications: Array<{ name: string; strength: string; amount: string; times: string[]; reminder: string | null }>;
  upcoming: Array<{ title: string; at: string }>;
};

export type CompanionResult = {
  reply: string;
  caregiverSummary: string | null;
  needsAttention: boolean;
};

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, limit) : "";
}

export function companionInstruction(context: CompanionContext) {
  const medicationList = context.medications.length
    ? context.medications
        .map((item) => `${item.name}: ${item.strength}, ${item.amount}, scheduled at ${item.times.join(", ")}${item.reminder ? ` (${item.reminder})` : ""}`)
        .join("\n")
    : "No caregiver-entered medication plans are available.";
  const upcoming = context.upcoming.length
    ? context.upcoming.map((item) => `${item.title} — ${item.at}`).join("\n")
    : "Nothing is scheduled in the near future.";

  return `You are KindCare Companion, a warm, concise voice-first companion for ${context.memberName}.
You help with everyday conversation, loneliness, gentle encouragement, and reading back the caregiver-entered schedule below.

Important limits:
- You are an AI, not a person, clinician, therapist, emergency service, or medical monitor.
- Never diagnose, interpret symptoms, recommend treatment, calculate doses, say whether a medicine is safe, or give missed-dose instructions.
- You may repeat the caregiver-entered medication schedule exactly. Remind ${context.memberName} to check the prescription label and contact their caregiver, pharmacist, or clinician if unsure.
- For urgent danger, severe symptoms, self-harm, or an immediate emergency, encourage calling local emergency services or a trusted person now. Do not claim you contacted anyone.
- Do not pressure ${context.memberName} to keep talking, guilt them, or imply exclusive friendship.

Caregiver-entered medication plan:
${medicationList}

Upcoming household plan:
${upcoming}

Return only valid JSON in this exact shape:
{"reply":"a warm spoken response under 90 words","caregiverSummary":"a brief factual summary under 220 characters, or null","needsAttention":false}

Only set needsAttention to true if ${context.memberName} explicitly requests help, says they feel unsafe, reports a potentially urgent health concern, or wants the caregiver contacted. Keep any summary respectful and minimal; never invent facts.`;
}

export async function askOpenAI(message: string, context: CompanionContext): Promise<CompanionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Companion service is not configured.");

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: companionInstruction(context) },
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      }),
    },
  );
  if (!response.ok) throw new Error("Companion service could not respond.");
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(raw) as Partial<CompanionResult>;
    const reply = cleanText(parsed.reply, 700);
    if (!reply) throw new Error("Empty companion reply");
    const caregiverSummary = cleanText(parsed.caregiverSummary, 220) || null;
    return { reply, caregiverSummary, needsAttention: parsed.needsAttention === true };
  } catch {
    throw new Error("Companion service returned an unusable response.");
  }
}
