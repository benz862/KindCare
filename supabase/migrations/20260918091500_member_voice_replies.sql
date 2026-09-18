drop policy voice_notes_insert on public.voice_notes;
create policy voice_notes_insert on public.voice_notes
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
      or (
        (select private.is_active_member(household_id))
        and exists (
          select 1 from public.household_members as hm
          where hm.household_id = voice_notes.household_id
            and hm.profile_id = voice_notes.recipient_id
            and hm.status = 'active'
            and hm.role in ('organizer', 'caregiver', 'helper')
        )
      )
    )
  );

drop policy scheduled_deliveries_insert on public.scheduled_deliveries;
create policy scheduled_deliveries_insert on public.scheduled_deliveries
  for insert to authenticated
  with check (
    (select private.has_role(household_id, array['organizer', 'caregiver', 'helper']::text[]))
    or (
      deliver_at <= now()
      and recurrence = 'none'
      and exists (
        select 1 from public.voice_notes as vn
        where vn.id = scheduled_deliveries.voice_note_id
          and vn.author_id = (select auth.uid())
          and vn.household_id = scheduled_deliveries.household_id
      )
    )
  );
