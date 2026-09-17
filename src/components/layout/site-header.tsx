import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5">
      <Link href="/" aria-label="KindCare home">
        <BrandMark />
      </Link>
      <nav className="flex items-center gap-3">
        <ButtonLink href="/sign-in" variant="ghost" size="compact">
          Sign in
        </ButtonLink>
        <ButtonLink href="/sign-up" size="compact">
          Get started
        </ButtonLink>
      </nav>
    </header>
  );
}
