import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell className="flex flex-col items-start justify-center">
      <h1 className="font-serif text-4xl font-semibold text-navy">Page not found</h1>
      <p className="mt-4 max-w-lg leading-7 text-ink/75">
        That KindCare page is not available. Return home or sign in to your private
        household.
      </p>
      <ButtonLink href="/" className="mt-6">
        Return to KindCare
      </ButtonLink>
    </PageShell>
  );
}
