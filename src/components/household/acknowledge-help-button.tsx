import { acknowledgeHelpAlert } from "@/app/help-actions";
import { Button } from "@/components/ui/button";

export function AcknowledgeHelpButton({ alertId }: { alertId: string }) {
  return (
    <form action={acknowledgeHelpAlert}>
      <input name="alertId" type="hidden" value={alertId} />
      <Button type="submit" variant="secondary" size="compact">
        Mark seen
      </Button>
    </form>
  );
}
