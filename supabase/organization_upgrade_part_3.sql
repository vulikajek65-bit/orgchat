create or replace function public.current_org_role(target_organization_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.organization_members
  where organization_id = target_organization_id
    and user_id = auth.uid()
  limit 1;
$$;
