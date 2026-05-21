import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Clock3,
  FileAudio,
  ImagePlus,
  LoaderCircle,
  Mic,
  Paperclip,
  Send,
  Square,
  X,
} from 'lucide-react';
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
    attachments: File[],
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setContent('');
    setIsUrgent(false);
    setUrgentReason('');
    setDeliveryMode('now');
    setAttachments([]);
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
    if (!content.trim() && !attachments.length) {
      return;
    }
    if (isUrgent && !urgentReason.trim()) {
      setError('Укажите причину срочного сообщения.');
      return;
    }

    setSending(true);
    setError('');

    try {
      await onSend(content.trim(), isUrgent, urgentReason.trim(), deliveryMode, attachments);
      setContent('');
      setIsUrgent(false);
      setUrgentReason('');
      setDeliveryMode('now');
      setAttachments([]);
    } catch (sendError) {
      console.error('Failed to send message.', sendError);
      setError(sendError instanceof Error ? sendError.message : 'Не удалось отправить сообщение.');
    } finally {
      setSending(false);
    }
  };

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setAttachments((current) => [...current, ...files].slice(0, 10));
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Запись голоса не поддерживается в этом браузере.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
        setAttachments((current) => [...current, voiceFile]);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (recordError) {
      console.error('Failed to start voice recording.', recordError);
      setError('Не удалось включить микрофон.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  if (!chat) {
    return (
      <section className="surface-card flex min-h-[420px] items-center justify-center rounded-lg bg-white p-6 shadow-soft">
        <p className="text-slate-500">Выберите чат, чтобы начать разговор.</p>
      </section>
    );
  }

  return (
    <section className={`surface-muted flex min-h-[560px] flex-col overflow-hidden rounded-lg bg-slate-100 shadow-soft ${sizeClasses.panelPadding}`}>
      <header className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold">{chat.title}</h2>
          <p className="text-sm text-slate-500">Рабочая беседа организации</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
          {memberCount} участников
        </span>
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
      <form className="sticky bottom-0 mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" onSubmit={handleSubmit}>
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
        {attachments.length ? (
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            {attachments.map((file, index) => (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2" key={`${file.name}-${index}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500">
                  {file.type.startsWith('image/') ? <ImagePlus className="h-5 w-5" /> : file.type.startsWith('audio/') ? <FileAudio className="h-5 w-5" /> : <Paperclip className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">{Math.ceil(file.size / 1024)} КБ</p>
                </div>
                <button className="rounded-lg p-1 hover:bg-slate-200" onClick={() => removeAttachment(index)} type="button">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            className={`min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 outline-none ring-brand-500 focus:bg-white focus:ring-2 ${sizeClasses.controlPadding}`}
            onChange={(event) => setContent(event.target.value)}
            placeholder={attachments.length ? 'Добавьте подпись к вложению...' : 'Сообщение, файл или голос...'}
            value={content}
          />
          <input
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            className="hidden"
            multiple
            onChange={addFiles}
            ref={fileInputRef}
            type="file"
          />
          <div className="flex gap-2">
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
              title="Прикрепить файл"
              type="button"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                recording ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => (recording ? stopRecording() : void startRecording())}
              title={recording ? 'Остановить запись' : 'Голосовое сообщение'}
              type="button"
            >
              {recording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={sending || (!content.trim() && !attachments.length)}
            type="submit"
          >
            {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Отправить
          </button>
          </div>
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
