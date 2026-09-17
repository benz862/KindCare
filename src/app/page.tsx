import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { SignInForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";
import { brand } from "@/lib/copy";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-[linear-gradient(160deg,#e8f7f4_0%,#f8fbfa_48%,#fff4ef_100%)]">
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-10 lg:grid-cols-2 lg:py-16">
        <section className="max-w-xl">
          <BrandMark />
          <p className="mt-10 text-xs font-bold tracking-[0.18em] text-navy/70">
            A SKILLBINDER LLC PRODUCT
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.05] text-navy sm:text-6xl">
            More connection.
            <br />
            More kindness.
            <br />
            More peace of mind.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-ink/80">
            KindCare gives families a calmer way to share small moments, thoughtful
            reminders, and everyday support.
          </p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-navy/8 bg-white/80 px-4 py-3 text-sm text-navy/80">
            <span aria-hidden="true" className="text-spark">
              ✦
            </span>
            Designed for the everyday moments that help people feel remembered and
            cared for.
          </p>
        </section>

        <Card className="mx-auto w-full max-w-md p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-navy/60">
            CARE, BEAUTIFULLY CONNECTED
          </p>
          <h2 className="mt-3 font-serif text-4xl font-semibold text-navy">
            Welcome back.
          </h2>
          <p className="mt-3 leading-7 text-ink/75">
            Sign in to your private KindCare space and stay close to the people who
            matter most.
          </p>
          <div className="mt-7">
            <SignInForm compact />
          </div>
          <p className="mt-4 flex flex-wrap justify-between gap-3 text-sm">
            <Link className="font-semibold text-navy underline-offset-4 hover:underline" href="/reset-password">
              Forgot password?
            </Link>
            <span>
              New to KindCare?{" "}
              <Link className="font-semibold text-navy underline-offset-4 hover:underline" href="/sign-up">
                Create an account
              </Link>
            </span>
          </p>
          <p className="mt-6 text-sm leading-6 text-navy/70">{brand.safety}</p>
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
