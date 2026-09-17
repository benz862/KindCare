import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center rounded-2xl font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-spark disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-navy text-cloud hover:bg-ink",
        secondary:
          "border border-navy/15 bg-white text-navy hover:border-navy/30 hover:bg-mist",
        teal: "bg-teal text-ink hover:bg-teal/90",
        spark: "bg-spark text-white hover:bg-spark/90",
        ghost: "bg-transparent text-navy hover:bg-mist",
      },
      size: {
        default: "min-h-12 px-5 text-base",
        member: "min-h-14 px-6 text-lg",
        compact: "min-h-10 px-4 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonStyles({ variant, size }), className)} {...props} />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonStyles>;

export function ButtonLink({
  className,
  variant,
  size,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonStyles({ variant, size }), className)} {...props} />
  );
}
