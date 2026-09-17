import { markOccurrence } from "@/app/checkin-actions";
import { Button } from "@/components/ui/button";

export function OccurrenceActions({
  occurrenceId,
  size = "compact",
}: {
  occurrenceId: string;
  size?: "compact" | "member";
}) {
  const buttonSize = size === "member" ? "member" : "compact";

  return (
    <div className="flex flex-wrap gap-2">
      <form action={markOccurrence}>
        <input name="occurrenceId" type="hidden" value={occurrenceId} />
        <input name="status" type="hidden" value="done" />
        <Button type="submit" size={buttonSize}>
          Done
        </Button>
      </form>
      <form action={markOccurrence}>
        <input name="occurrenceId" type="hidden" value={occurrenceId} />
        <input name="status" type="hidden" value="skipped" />
        <Button type="submit" variant="secondary" size={buttonSize}>
          Skip
        </Button>
      </form>
      <form action={markOccurrence}>
        <input name="occurrenceId" type="hidden" value={occurrenceId} />
        <input name="status" type="hidden" value="needs_help" />
        <Button type="submit" variant="spark" size={buttonSize}>
          I need help
        </Button>
      </form>
    </div>
  );
}
