import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// TODO: в продакшене доставку нужно вынести в Supabase Edge Function + cron.
export const deliverDueScheduledMessages = async (
  supabase: SupabaseClient<Database>,
  userId: string,
) => {
  const now = new Date().toISOString();
  const { data: dueMessages, error: loadError } = await supabase
    .from('messages')
    .select('*')
    .eq('sender_id', userId)
    .eq('is_delivered', false)
    .lte('scheduled_for', now);

  if (loadError) {
    console.error('Failed to load due scheduled messages.', loadError);
    throw new Error('Не удалось проверить запланированные сообщения.');
  }

  const { error } = await supabase
    .from('messages')
    .update({ is_delivered: true })
    .eq('sender_id', userId)
    .eq('is_delivered', false)
    .lte('scheduled_for', now);

  if (error) {
    console.error('Failed to deliver due scheduled messages.', error);
    throw new Error('Не удалось доставить запланированные сообщения.');
  }

  return dueMessages ?? [];
};
