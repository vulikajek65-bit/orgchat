import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Clock3, LoaderCircle, Send } from 'lucide-react';
import type { Chat, DeliveryMode, MemberWithProfile, MessageWithProfile, Profile } from '../types/database';
import type { UiSettings } from '../utils/uiSettings';
import { getInterfaceSizeClasses, getMessageDensityClasses } from '../utils/uiClasses';
import { MessageBubble } from './MessageBubble';
import { canSendMessage } from '../utils/permissions';
import type { MemberRole } from '../types/database';
import { getMemberDisplayStatus } from '../utils/memberStatus';
import { ScheduledMessagesPanel } from './ScheduledMessagesPanel';

interface ChatViewProps {
  chat: Chat | null;
  currentUser: Profile;
  messages: MessageWithProfile[];
  loading: boolean;
  settings: UiSettings;
  currentRole: MemberRole;
  memberCount: number;
  members: MemberWithProfile[];
  scheduledMessages: MessageWithProfile[];
  onAcknowledge: (messageId: string) => Promise<void>;
  onSend: (
    content: string,
    isUrgent: boolean,
    urgentReason: string,
    deliveryMode: DeliveryMode,
  ) => Promise<void>;
}

export const ChatView = ({
  chat,
  currentUser,
  messages,
  loading,
  settings,
  currentRole,
  memberCount,
  members,
  scheduledMessages,
  onAcknowledge,
  onSend,
}: ChatViewProps) => {
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('now');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setContent('');
    setIsUrgent(false);
    setUrgentReason('');
    setDeliveryMode('now');
    setError('');
  }, [chat?.id]);

  const orderedMessages = useMemo(
    () => [...messages].sort((left, right) => left.created_at.localeCompare(right.created_at)),
    [messages],
  );
  const sizeClasses = getInterfaceSizeClasses(settings);
  const messageDensityClasses = getMessageDensityClasses(settings);
  const allowedToSend = chat ? canSendMessage(currentRole, chat.type) : false;
  const offShiftCount = members.filter((member) => getMemberDisplayStatus(member) !== 'working').length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    if (isUrgent && !urgentReason.trim()) {
      setError('Укажите причину срочного сообщения.');
      return;
    }

    setSending(true);
    setError('');

    try {
      await onSend(content.trim(), isUrgent, urgentReason.trim(), deliveryMode);
      setContent('');
      setIsUrgent(false);
      setUrgentReason('');
      setDeliveryMode('now');
    } catch (sendError) {
      console.error('Failed to send message.', sendError);
      setError(sendError instanceof Error ? sendError.message : 'Не удалось отправить сообщение.');
    } finally {
      setSending(false);
    }
  };

  if (!chat) {
    return (
      <section className="surface-card flex min-h-[420px] items-center justify-center rounded-lg bg-white p-6 shadow-soft">
        <p className="text-slate-500">Выберите чат, чтобы начать разговор.</p>
      </section>
    );
  }

  return (
    <section className={`surface-muted flex min-h-[560px] flex-col rounded-lg bg-slate-100 shadow-soft ${sizeClasses.panelPadding}`}>
      <header className="mb-4 border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold">{chat.title}</h2>
        <p className="text-sm text-slate-500">Рабочая беседа организации</p>
      </header>

      <div className={`flex-1 overflow-y-auto pr-1 ${messageDensityClasses}`}>
        <ScheduledMessagesPanel messages={scheduledMessages} />
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-500">
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Загружаем сообщения
          </div>
        ) : orderedMessages.length ? (
          orderedMessages.map((message) => (
            <MessageBubble
              isOwn={message.sender_id === currentUser.id}
              key={message.id}
              message={message}
              messageTextClass={sizeClasses.messageText}
              view={settings.messageView}
              isAnnouncement={chat.type === 'announcement'}
              canViewAcknowledgements={['owner', 'admin', 'manager'].includes(currentRole)}
              memberCount={memberCount}
              acknowledgedByCurrentUser={message.acknowledgements.some(
                (acknowledgement) => acknowledgement.user_id === currentUser.id,
              )}
              onAcknowledge={onAcknowledge}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center text-slate-500">
            Сообщений пока нет. Напишите первое сообщение.
          </div>
        )}
      </div>

      {allowedToSend ? (
      <form className="sticky bottom-0 mt-4 border-t border-slate-200 bg-slate-100 pt-4" onSubmit={handleSubmit}>
        <label className="mb-3 flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-3">
          <span className="flex items-center gap-2">
          <input
            checked={isUrgent}
            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            onChange={(event) => setIsUrgent(event.target.checked)}
            type="checkbox"
          />
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Срочное сообщение
          </span>
          <span className="text-slate-500">Срочные сообщения смогут проходить вне рабочего времени.</span>
        </label>
        {isUrgent ? (
          <label className="mb-3 block text-sm text-slate-600">
            <span className="mb-1 block">Причина срочности</span>
            <input
              className={`w-full rounded-lg border border-amber-200 bg-white outline-none ring-amber-400 focus:ring-2 ${sizeClasses.controlPadding}`}
              onChange={(event) => setUrgentReason(event.target.value)}
              placeholder="Например: авария на объекте, срочная замена, клиент ждет ответ"
              value={urgentReason}
            />
          </label>
        ) : null}
        <p className="mb-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
          {isUrgent
            ? 'Срочное сообщение отправит уведомление даже вне рабочего времени. Укажите причину.'
            : offShiftCount
              ? `${offShiftCount} сотрудника сейчас не на смене. Обычные уведомления будут отложены до начала их рабочего дня.`
              : 'Все участники сейчас на смене.'}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={`min-w-0 flex-1 rounded-lg border border-slate-200 bg-white outline-none ring-brand-500 focus:ring-2 ${sizeClasses.controlPadding}`}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Напишите сообщение..."
            value={content}
          />
          <button
            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70 ${sizeClasses.controlPadding}`}
            disabled={sending || !content.trim()}
            type="submit"
          >
            {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Отправить
          </button>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
          <Clock3 className="h-4 w-4" />
          <span>Доставка:</span>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none"
            onChange={(event) => setDeliveryMode(event.target.value as DeliveryMode)}
            value={deliveryMode}
          >
            <option value="now">Отправить сейчас</option>
            <option value="next_shift">Отправить к началу смены</option>
          </select>
        </label>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </form>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          В этом канале писать могут только руководители.
        </div>
      )}
    </section>
  );
};
