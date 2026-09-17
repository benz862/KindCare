revoke execute on function public.create_invitation(uuid, text, text) from public, anon;
revoke execute on function public.accept_invitation(text) from public, anon;
revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.invitation_preview(text) from public;

grant execute on function public.create_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.invitation_preview(text) to anon, authenticated;
