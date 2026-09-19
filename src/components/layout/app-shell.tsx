import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { PatientSwitcher } from "@/components/patient/patient-switcher";
import type { HouseholdRole } from "@/lib/roles";
import { isCareTeamRole, roleLabels } from "@/lib/roles";
import { cn } from "@/lib/cn";

type AppShellProps = {
  children: ReactNode;
  displayName: string;
  role: HouseholdRole;
  householdName: string;
  patients?: { id: string; displayName: string }[];
  activePatientId?: string;
  activePatientName?: string;
};

export function AppShell({
  children,
  displayName,
  role,
  householdName,
  patients = [],
  activePatientId,
  activePatientName,
}: AppShellProps) {
  const careTeam = isCareTeamRole(role);

  return (
    <div className="flex min-h-full flex-col bg-cloud">
      <header className="border-b border-navy/8 bg-white/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={careTeam ? "/today" : "/home"} aria-label="KindCare home">
            <BrandMark />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-navy/75">
              <span className="font-semibold text-navy">{displayName}</span>
              <span className="mx-2">·</span>
              {roleLabels[role]}
              {activePatientName ? ` for ${activePatientName}` : ` in ${householdName}`}
            </p>
            {careTeam && activePatientId ? (
              <PatientSwitcher patients={patients} activePatientId={activePatientId} />
            ) : null}
            <nav className="flex flex-wrap items-center gap-2">
              {careTeam ? (
                <>
                  <NavLink href="/today">Today</NavLink>
                  <NavLink href="/messages">Messages</NavLink>
                  <NavLink href="/calendar">Calendar</NavLink>
                  <NavLink href="/plan">Plan</NavLink>
                  <NavLink href="/moments">Moments</NavLink>
                  <NavLink href="/people">People</NavLink>
                </>
              ) : (
                <>
                  <NavLink href="/home">Home</NavLink>
                  <NavLink href="/moments">Moments</NavLink>
                </>
              )}
              <NavLink href="/notices">Notices</NavLink>
              <NavLink href="/settings">Settings</NavLink>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="compact">
                  Sign out
                </Button>
              </form>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center rounded-2xl px-3 text-sm font-semibold text-navy hover:bg-mist",
      )}
    >
      {children}
    </Link>
  );
}
