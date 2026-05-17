import type { MessageWithProfile } from '../types/database';
import type { UiSettings } from '../utils/uiSettings';

interface MessageBubbleProps {
  message: MessageWithProfile;
  isOwn: boolean;
  view: UiSettings['messageView'];
  messageTextClass: string;
  isAnnouncement: boolean;
  canViewAcknowledgements: boolean;
  memberCount: number;
  acknowledgedByCurrentUser: boolean;
  onAcknowledge: (messageId: string) => Promise<void>;
}

export const MessageBubble = ({
  message,
  isOwn,
  view,
  messageTextClass,
  isAnnouncement,
  canViewAcknowledgements,
  memberCount,
  acknowledgedByCurrentUser,
  onAcknowledge,
}: MessageBubbleProps) => {
  const time = new Date(message.created_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (view === 'rows') {
    return (
      <article
        className={`surface-card rounded-lg border px-4 py-3 ${
          message.is_urgent ? 'border-amber-300 bg-amber-50' : 'surface-border border-slate-200'
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex min-w-[150px] items-center gap-2 text-sm">
            <span className="font-medium">{message.sender.full_name}</span>
            <span className="text-slate-400">{time}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`whitespace-pre-wrap break-words leading-6 ${messageTextClass}`}>
                {message.content}
              </p>
              {message.is_urgent ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Срочно
                </span>
              ) : null}
            </div>
            {message.is_urgent && message.urgent_reason ? (
              <p className="mt-2 text-sm text-amber-900">Причина: {message.urgent_reason}</p>
            ) : null}
            {message.delivery_mode === 'next_shift' ? (
              <p className="mt-2 text-xs text-slate-500">Отправлено к началу смены</p>
            ) : null}
            {isAnnouncement ? (
              <AnnouncementFooter
                acknowledgedByCurrentUser={acknowledgedByCurrentUser}
                canViewAcknowledgements={canViewAcknowledgements}
                memberCount={memberCount}
                message={message}
                onAcknowledge={onAcknowledge}
              />
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] rounded-lg px-4 py-3 shadow-sm sm:max-w-[70%] ${
          isOwn ? 'bg-brand-600 text-white' : 'bg-white text-slate-900'
        } ${message.is_urgent ? 'ring-2 ring-amber-400' : ''}`}
      >
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
          <span className={isOwn ? 'text-sky-100' : 'text-slate-500'}>
            {message.sender.full_name}
          </span>
          <span className={isOwn ? 'text-sky-100' : 'text-slate-400'}>{time}</span>
          {message.is_urgent ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
              Срочно
            </span>
          ) : null}
        </div>
        <p className={`whitespace-pre-wrap break-words leading-6 ${messageTextClass}`}>
          {message.content}
        </p>
        {message.is_urgent && message.urgent_reason ? (
          <p className={`mt-2 text-sm ${isOwn ? 'text-amber-100' : 'text-amber-800'}`}>
            Причина: {message.urgent_reason}
          </p>
        ) : null}
        {message.delivery_mode === 'next_shift' ? (
          <p className={`mt-2 text-xs ${isOwn ? 'text-sky-100' : 'text-slate-500'}`}>
            Отправлено к началу смены
          </p>
        ) : null}
        {isAnnouncement ? (
          <AnnouncementFooter
            acknowledgedByCurrentUser={acknowledgedByCurrentUser}
            canViewAcknowledgements={canViewAcknowledgements}
            memberCount={memberCount}
            message={message}
            onAcknowledge={onAcknowledge}
          />
        ) : null}
      </div>
    </article>
  );
};

const AnnouncementFooter = ({
  message,
  acknowledgedByCurrentUser,
  canViewAcknowledgements,
  memberCount,
  onAcknowledge,
}: {
  message: MessageWithProfile;
  acknowledgedByCurrentUser: boolean;
  canViewAcknowledgements: boolean;
  memberCount: number;
  onAcknowledge: (messageId: string) => Promise<void>;
}) => (
  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
    <button
      className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-800 disabled:opacity-70"
      disabled={acknowledgedByCurrentUser}
      onClick={() => void onAcknowledge(message.id)}
      type="button"
    >
      {acknowledgedByCurrentUser ? 'Принято' : 'Принял'}
    </button>
    {canViewAcknowledgements ? (
      <span className="text-slate-500">
        Приняли: {message.acknowledgements.length} из {memberCount}
      </span>
    ) : null}
  </div>
);
