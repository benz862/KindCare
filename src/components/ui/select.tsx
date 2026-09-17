import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-xl border border-navy/15 bg-white px-3.5 text-base font-normal text-ink outline-none transition-colors focus:border-teal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-spark",
        className,
      )}
      {...props}
    />
  );
}
