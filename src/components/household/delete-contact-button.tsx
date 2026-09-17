import { deleteContact } from "@/app/contact-actions";
import { Button } from "@/components/ui/button";

export function DeleteContactButton({ contactId }: { contactId: string }) {
  return (
    <form action={deleteContact}>
      <input name="contactId" type="hidden" value={contactId} />
      <Button type="submit" variant="ghost" size="compact">
        Remove
      </Button>
    </form>
  );
}
