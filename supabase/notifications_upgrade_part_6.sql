alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.organization_members;

-- TODO: автоматическую доставку next_shift в продакшене
-- вынести в Supabase Edge Function + cron.
