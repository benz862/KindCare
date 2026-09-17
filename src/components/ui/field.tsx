import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
};

export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-ink">
      {label}
      {children}
      {hint ? <span className="font-normal text-navy/70">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-navy/15 bg-white px-3.5 text-base font-normal text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-teal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-spark",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-navy/15 bg-white px-3.5 py-3 text-base font-normal text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-teal focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-spark",
        className,
      )}
      {...props}
    />
  );
}
