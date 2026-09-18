import { deleteMoment } from "@/app/moment-actions";
import { Button } from "@/components/ui/button";
import { formatWhen } from "@/lib/time";

export type MomentCard = {
  id: string;
  body: string | null;
  photoUrl: string | null;
  authorName: string;
  createdAt: string;
  canDelete: boolean;
};

export function MomentList({
  moments,
  timeZone,
  size = "care",
}: {
  moments: MomentCard[];
  timeZone: string;
  size?: "care" | "member";
}) {
  if (moments.length === 0) {
    return (
      <p className={size === "member" ? "mt-3 text-lg leading-8 text-ink/75" : "mt-2 leading-7 text-ink/75"}>
        No family moments yet. This board stays inside the household.
      </p>
    );
  }

  return (
    <ol className="mt-4 grid gap-4">
      {moments.map((moment) => (
        <li key={moment.id} className="rounded-2xl bg-mist px-4 py-4">
          <p className={size === "member" ? "text-base text-navy/70" : "text-sm text-navy/70"}>
            {moment.authorName} · {formatWhen(moment.createdAt, timeZone)}
          </p>
          {moment.body ? (
            <p className={size === "member" ? "mt-2 text-lg leading-8 text-ink" : "mt-2 leading-7 text-ink"}>
              {moment.body}
            </p>
          ) : null}
          {moment.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={moment.photoUrl}
              alt=""
              className="mt-3 max-h-80 w-full rounded-2xl object-cover"
            />
          ) : null}
          {moment.canDelete ? (
            <form action={deleteMoment} className="mt-3">
              <input name="momentId" type="hidden" value={moment.id} />
              <Button type="submit" variant="ghost" size="compact">
                Remove
              </Button>
            </form>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
