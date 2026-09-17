"use client";

import { useState } from "react";

import { markDose } from "@/app/checkin-actions";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/copy";
import { cn } from "@/lib/cn";

export function DoseActions({
  doseId,
  size = "compact",
  showCaregiverNote = false,
  showSafety = false,
}: {
  doseId: string;
  size?: "compact" | "member";
  showCaregiverNote?: boolean;
  showSafety?: boolean;
}) {
  const [note, setNote] = useState("");
  const buttonSize = size === "member" ? "member" : "compact";

  return (
    <div className="grid gap-3">
      {showSafety ? (
        <p className={cn("leading-7 text-navy/80", size === "member" ? "text-lg" : "text-sm")}>
          {brand.medication}
        </p>
      ) : null}
      {showCaregiverNote ? (
        <input
          className="min-h-10 w-full rounded-xl border border-navy/15 bg-white px-3 text-sm"
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note. This records who marked it, not that medicine was taken."
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <StatusForm doseId={doseId} status="taken" note={note} size={buttonSize}>
          Taken
        </StatusForm>
        <StatusForm doseId={doseId} status="skipped" note={note} size={buttonSize} variant="secondary">
          Skip
        </StatusForm>
        <StatusForm doseId={doseId} status="needs_help" note={note} size={buttonSize} variant="spark">
          I need help
        </StatusForm>
      </div>
    </div>
  );
}

function StatusForm({
  doseId,
  status,
  note,
  size,
  variant,
  children,
}: {
  doseId: string;
  status: "taken" | "skipped" | "needs_help";
  note: string;
  size: "compact" | "member";
  variant?: "primary" | "secondary" | "spark";
  children: string;
}) {
  return (
    <form action={markDose}>
      <input name="doseId" type="hidden" value={doseId} />
      <input name="status" type="hidden" value={status} />
      {note ? <input name="caregiverNote" type="hidden" value={note} /> : null}
      <Button type="submit" size={size} variant={variant}>
        {children}
      </Button>
    </form>
  );
}
