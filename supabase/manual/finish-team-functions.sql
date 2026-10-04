-- Paste into Supabase → SQL Editor → Run. Adds revoke invitation, accept invitation and remove member.
create or replace function public.revoke_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_company_owner() then
    raise exception 'only the company owner can revoke';
  end if;
  delete from public.invitations where id = p_id and company_id = public.my_company_id() and accepted_at is null;
end;
$$;

create or replace function public.accept_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.invitations;
  v_old uuid := public.my_company_id();
begin
  select * into v_invite from public.invitations
    where id = p_id and accepted_at is null and lower(email) = lower(auth.jwt() ->> 'email');
  if not found then
    raise exception 'invitation not found';
  end if;
  if v_old = v_invite.company_id then
    update public.invitations set accepted_at = now() where id = p_id;
    return;
  end if;
  if v_old is not null and public.is_company_owner()
     and exists (select 1 from public.company_members where company_id = v_old and user_id <> auth.uid()) then
    raise exception 'transfer ownership first';
  end if;
  delete from public.company_members where user_id = auth.uid();
  insert into public.company_members (company_id, user_id, role) values (v_invite.company_id, auth.uid(), 'member');
  update public.invitations set accepted_at = now() where id = p_id;
  if v_old is not null and not exists (select 1 from public.company_members where company_id = v_old) then
    delete from public.companies where id = v_old;
  end if;
  perform public.notify(v_invite.company_id, null, 'team_joined',
    jsonb_build_object('name', coalesce((select full_name from public.profiles where id = auth.uid()), auth.jwt() ->> 'email')),
    '/app/team');
end;
$$;

create or replace function public.remove_member(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid := public.my_company_id();
  v_name text;
  v_new uuid;
begin
  if not public.is_company_owner() then
    raise exception 'only the company owner can remove members';
  end if;
  if p_user = auth.uid() then
    raise exception 'owners cannot remove themselves';
  end if;
  delete from public.company_members where company_id = v_company and user_id = p_user;
  if not found then
    raise exception 'not a member';
  end if;
  select coalesce(full_name, split_part(email, '@', 1)) into v_name from public.profiles where id = p_user;
  insert into public.companies (name) values (left(v_name, 200)) returning id into v_new;
  insert into public.company_members (company_id, user_id, role) values (v_new, p_user, 'owner');
end;
$$;

revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.accept_invitation(uuid) from public, anon;
revoke execute on function public.remove_member(uuid) from public, anon;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
