"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="grid gap-3">
      <input
        readOnly
        value={url}
        className="min-h-12 w-full rounded-xl border border-navy/15 bg-mist px-3.5 text-sm text-ink"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy invitation link"}
      </Button>
    </div>
  );
}
