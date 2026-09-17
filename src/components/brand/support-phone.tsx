import { brand } from "@/lib/copy";
import { cn } from "@/lib/cn";

export function SupportPhone({
  className,
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <a
      className={cn(
        "font-semibold text-navy underline-offset-4 hover:underline",
        className,
      )}
      href={`tel:${brand.supportPhoneTel}`}
    >
      {showLabel ? `Customer support ${brand.supportPhone}` : brand.supportPhone}
    </a>
  );
}
