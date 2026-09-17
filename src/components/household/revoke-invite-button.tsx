import { revokeInvitation } from "@/app/household-actions";
import { Button } from "@/components/ui/button";

export function RevokeInviteButton({ invitationId }: { invitationId: string }) {
  return (
    <form action={revokeInvitation}>
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" variant="ghost" size="compact">
        Revoke
      </Button>
    </form>
  );
}
