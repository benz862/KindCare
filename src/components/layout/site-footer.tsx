import Link from "next/link";

import { SupportEmail } from "@/components/brand/support-email";
import { SupportPhone } from "@/components/brand/support-phone";
import { brand } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-navy/8 bg-cloud">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-navy/75 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {brand.owner}. {brand.ownerLine}{" "}
          <a className="underline-offset-4 hover:text-navy hover:underline" href={brand.siteUrl}>
            {brand.domain}
          </a>
        </p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SupportPhone />
          <SupportEmail />
          <Link className="underline-offset-4 hover:text-navy hover:underline" href="/privacy">
            Privacy notice
          </Link>
          <Link className="underline-offset-4 hover:text-navy hover:underline" href="/terms">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
