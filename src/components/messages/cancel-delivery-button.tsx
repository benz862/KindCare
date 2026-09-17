import { cancelScheduledDelivery } from "@/app/message-actions";
import { Button } from "@/components/ui/button";

export function CancelDeliveryButton({ deliveryId }: { deliveryId: string }) {
  return (
    <form action={cancelScheduledDelivery}>
      <input name="deliveryId" type="hidden" value={deliveryId} />
      <Button type="submit" variant="ghost" size="compact">
        Cancel
      </Button>
    </form>
  );
}
