import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-navy/8 bg-white p-7 shadow-[0_20px_55px_rgba(11,74,134,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
