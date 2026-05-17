import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import type { Notification } from '../types/database';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAllRead: () => Promise<void>;
  onNotificationClick: (notification: Notification) => Promise<void>;
}

export const NotificationBell = ({
  notifications,
  onMarkAllRead,
  onNotificationClick,
}: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markAllRead = async () => {
    setBusy(true);
    try {
      await onMarkAllRead();
    } catch (error) {
      console.error('Failed to mark all notifications read.', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        aria-label="Открыть уведомления"
        className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-soft"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell className="h-5 w-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-xs font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-30 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Уведомления</h3>
            <button
              className="inline-flex items-center gap-1 text-sm text-brand-700 disabled:opacity-60"
              disabled={busy || !unreadCount}
              onClick={() => void markAllRead()}
              type="button"
            >
              <CheckCheck className="h-4 w-4" />
              Прочитать все
            </button>
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {notifications.length ? (
              notifications.map((notification) => (
                <button
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    notification.is_read ? 'border-slate-200' : 'border-brand-200 bg-brand-50'
                  }`}
                  key={notification.id}
                  onClick={() => void onNotificationClick(notification)}
                  type="button"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{notification.title}</p>
                    {notification.is_silent ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        К началу смены
                      </span>
                    ) : null}
                    {notification.type === 'urgent_message' ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Срочно
                      </span>
                    ) : null}
                  </div>
                  {notification.body ? (
                    <p className="mt-1 text-sm text-slate-600">{notification.body}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(notification.created_at).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {!notification.is_read ? (
                    <span className="mt-2 inline-flex rounded-full bg-brand-600 px-2.5 py-1 text-xs font-medium text-white">
                      Прочитать
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Уведомлений пока нет.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
