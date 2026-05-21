import { Download, FileArchive, FileAudio, FileText, ImageIcon, Music, Video } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MessageAttachment, MessageWithProfile } from '../types/database';
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
  const hasTextContent = Boolean(
    message.content.trim() && !(message.content === 'Вложение' && message.attachments.length),
  );

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
              {hasTextContent ? (
                <p className={`whitespace-pre-wrap break-words leading-6 ${messageTextClass}`}>
                  {message.content}
                </p>
              ) : null}
              {message.is_urgent ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Срочно
                </span>
              ) : null}
            </div>
            <AttachmentList attachments={message.attachments} isOwn={false} />
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
        className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
          isOwn ? 'bg-brand-600 text-white' : 'bg-white text-slate-900'
        } ${isOwn ? 'rounded-br-lg' : 'rounded-bl-lg'} ${message.is_urgent ? 'ring-2 ring-amber-400' : ''}`}
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
        {hasTextContent ? (
          <p className={`whitespace-pre-wrap break-words leading-6 ${messageTextClass}`}>
            {message.content}
          </p>
        ) : null}
        <AttachmentList attachments={message.attachments} isOwn={isOwn} />
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

const AttachmentList = ({
  attachments,
  isOwn,
}: {
  attachments: MessageAttachment[];
  isOwn: boolean;
}) => {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2">
      {attachments.map((attachment) => (
        <AttachmentPreview attachment={attachment} isOwn={isOwn} key={attachment.id} />
      ))}
    </div>
  );
};

const AttachmentPreview = ({
  attachment,
  isOwn,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
}) => {
  const baseCardClass = isOwn
    ? 'border-white/20 bg-white text-slate-900'
    : 'border-slate-200 bg-slate-50 text-slate-900';

  if (attachment.kind === 'image') {
    return (
      <a
        className={`group block overflow-hidden rounded-2xl border ${baseCardClass}`}
        href={attachment.file_url}
        rel="noreferrer"
        target="_blank"
      >
        <img
          alt={attachment.file_name}
          className="max-h-80 w-full object-cover transition group-hover:scale-[1.01]"
          loading="lazy"
          src={attachment.file_url}
        />
        <AttachmentCaption attachment={attachment} icon={<ImageIcon className="h-4 w-4" />} />
      </a>
    );
  }

  if (attachment.kind === 'video') {
    return (
      <div className={`overflow-hidden rounded-2xl border ${baseCardClass}`}>
        <video className="max-h-80 w-full bg-black" controls preload="metadata" src={attachment.file_url} />
        <AttachmentCaption attachment={attachment} icon={<Video className="h-4 w-4" />} />
      </div>
    );
  }

  if (attachment.kind === 'audio') {
    const isVoice = attachment.file_name.toLowerCase().startsWith('voice-');
    return (
      <div className={`rounded-2xl border p-3 ${baseCardClass}`}>
        <AttachmentCaption
          attachment={attachment}
          icon={isVoice ? <FileAudio className="h-4 w-4" /> : <Music className="h-4 w-4" />}
          label={isVoice ? 'Голосовое сообщение' : undefined}
        />
        <audio className="mt-3 w-full" controls preload="metadata" src={attachment.file_url} />
      </div>
    );
  }

  const icon =
    attachment.kind === 'document' ? (
      <FileText className="h-5 w-5" />
    ) : (
      <FileArchive className="h-5 w-5" />
    );

  return (
    <a
      className={`flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 ${baseCardClass}`}
      href={attachment.file_url}
      rel="noreferrer"
      target="_blank"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900/5 text-slate-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{attachment.file_name}</p>
        <p className="text-xs text-slate-500">{formatFileSize(attachment.size_bytes)}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 text-slate-400" />
    </a>
  );
};

const AttachmentCaption = ({
  attachment,
  icon,
  label,
}: {
  attachment: MessageAttachment;
  icon: ReactNode;
  label?: string;
}) => (
  <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500">
    <span className="text-slate-400">{icon}</span>
    <span className="min-w-0 flex-1 truncate">{label ?? attachment.file_name}</span>
    <span>{formatFileSize(attachment.size_bytes)}</span>
  </div>
);

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} КБ`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
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
