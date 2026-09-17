import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function MemberAction({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button {...props} size="member" className={cn("w-full", className)} />;
}
