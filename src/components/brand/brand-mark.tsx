import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  showWordmark?: boolean;
};

export function BrandMark({ className, showWordmark = true }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="h-11 w-11 shrink-0"
      >
        <path
          d="M18 38c0-8 5-14 13-16 1.5 6 1 12-2 17-2.2 3.6-6.4 6.2-11 6.8-1.4-2.4 0-5.2 0-7.8Z"
          fill="#0B4A86"
        />
        <path
          d="M46 38c0-8-5-14-13-16-1.5 6-1 12 2 17 2.2 3.6 6.4 6.2 11 6.8 1.4-2.4 0-5.2 0-7.8Z"
          fill="#10C1B5"
        />
        <path
          d="M32 18.5 34.8 24l6 .7-4.5 4.1 1.2 5.9L32 31.7l-5.5 3 1.2-5.9-4.5-4.1 6-.7Z"
          fill="#FF724F"
        />
      </svg>
      {showWordmark ? (
        <span className="font-serif text-[1.65rem] font-semibold tracking-tight text-navy">
          KindCare
        </span>
      ) : (
        <span className="sr-only">KindCare</span>
      )}
    </span>
  );
}
