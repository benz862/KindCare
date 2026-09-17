import { brand } from "@/lib/copy";
import { cn } from "@/lib/cn";

export function SupportEmail({
  className,
  address = brand.supportEmail,
}: {
  className?: string;
  address?: string;
}) {
  return (
    <a
      className={cn(
        "font-semibold text-navy underline-offset-4 hover:underline",
        className,
      )}
      href={`mailto:${address}`}
    >
      {address}
    </a>
  );
}
