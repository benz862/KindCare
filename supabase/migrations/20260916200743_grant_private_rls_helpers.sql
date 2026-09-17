grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_active_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, text[]) to authenticated;
grant execute on function private.current_profile_id() to authenticated;
alter default privileges in schema private revoke all on functions from public;
alter default privileges in schema private revoke all on functions from anon;
alter default privileges in schema private revoke all on functions from authenticated;
