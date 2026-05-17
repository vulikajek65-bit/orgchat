import type { MessageWithProfile } from '../types/database';

interface ScheduledMessagesPanelProps {
  messages: MessageWithProfile[];
}

export const ScheduledMessagesPanel = ({ messages }: ScheduledMessagesPanelProps) => {
  if (!messages.length) {
    return null;
  }

  return (
    <section className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
      <h3 className="font-semibold text-sky-950">Запланированные сообщения</h3>
      <div className="mt-3 space-y-2">
        {messages.map((message) => (
          <article className="rounded-lg bg-white p-3 text-sm text-slate-700" key={message.id}>
            <p>{message.content}</p>
            <p className="mt-1 text-xs text-slate-500">
              Будет отправлено{' '}
              {message.scheduled_for
                ? new Date(message.scheduled_for).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'к началу смены'}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
