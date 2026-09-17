import { deleteCalendarEvent, markCalendarTask } from "@/app/calendar-actions";
import { deactivateMedicationPlan, deactivateRoutine } from "@/app/plan-actions";
import { resolveMemberRequest } from "@/app/request-actions";
import { markNoticeRead } from "@/app/notice-actions";
import { Button } from "@/components/ui/button";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  return (
    <form action={deleteCalendarEvent}>
      <input name="eventId" type="hidden" value={eventId} />
      <Button type="submit" variant="ghost" size="compact">
        Remove
      </Button>
    </form>
  );
}

export function CompleteTaskButton({ eventId }: { eventId: string }) {
  return (
    <form action={markCalendarTask}>
      <input name="eventId" type="hidden" value={eventId} />
      <input name="status" type="hidden" value="done" />
      <Button type="submit" variant="secondary" size="compact">
        Done
      </Button>
    </form>
  );
}

export function StopRoutineButton({ routineId }: { routineId: string }) {
  return (
    <form action={deactivateRoutine}>
      <input name="routineId" type="hidden" value={routineId} />
      <Button type="submit" variant="ghost" size="compact">
        Stop reminder
      </Button>
    </form>
  );
}

export function StopPlanButton({ planId }: { planId: string }) {
  return (
    <form action={deactivateMedicationPlan}>
      <input name="planId" type="hidden" value={planId} />
      <Button type="submit" variant="ghost" size="compact">
        Stop this plan
      </Button>
    </form>
  );
}

export function ResolveRequestButton({ requestId }: { requestId: string }) {
  return (
    <form action={resolveMemberRequest}>
      <input name="requestId" type="hidden" value={requestId} />
      <Button type="submit" variant="secondary" size="compact">
        Mark resolved
      </Button>
    </form>
  );
}

export function MarkNoticeReadButton({ noticeId }: { noticeId: string }) {
  return (
    <form action={markNoticeRead}>
      <input name="noticeId" type="hidden" value={noticeId} />
      <Button type="submit" variant="ghost" size="compact">
        Mark read
      </Button>
    </form>
  );
}
