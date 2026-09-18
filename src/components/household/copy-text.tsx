"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyText({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="grid gap-3">
      <textarea
        readOnly
        value={value}
        rows={6}
        className="w-full rounded-xl border border-navy/15 bg-mist px-3.5 py-3 text-sm leading-6 text-ink"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : label}
      </Button>
    </div>
  );
}
