# OrgChat

MVP корпоративного мессенджера для организаций на React, Vite, Tailwind CSS и Supabase.

## Что уже работает

- Регистрация руководителя с созданием организации, owner membership, invite code и общего чата.
- Регистрация сотрудника по коду приглашения.
- Вход через Supabase Auth.
- Dashboard организации с названием, кодом приглашения, списком чатов и сотрудников.
- Общий чат с сохранением сообщений в Supabase.
- Realtime-подписка на новые сообщения через Supabase Realtime.
- Срочные сообщения с обязательной причиной.
- Внутренние уведомления с учетом рабочего времени и колокольчиком в dashboard.
- Ручные статусы `Авто / На смене / Перерыв / Занят / Не на смене / Отпуск`.
- Запланированная отправка `к началу смены`.
- Расчет статуса `На смене / Не на смене` по рабочему времени.

## Стек

- React + Vite
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database + Realtime

## Локальный запуск

1. Установите зависимости:

```bash
npm install
```

2. Создайте файл `.env.local` на основе `.env.example`:

```bash
cp .env.example .env.local
```

3. Заполните переменные окружения:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Запустите dev-сервер:

```bash
npm run dev
```

## Продакшен-деплой

OrgChat сейчас состоит из статического React/Vite frontend и Supabase backend, поэтому отдельный Node.js-сервер для самого интерфейса не нужен.

1. Соберите проект:

```bash
npm run build
```

2. На хостинге задайте переменные окружения:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Используйте:
- `Build command`: `npm run build`
- `Output directory`: `dist`

4. Для SPA fallback уже добавлены:
- `public/_redirects` для Netlify/совместимых static hosts;
- `vercel.json` для Vercel.

5. После публикации откройте приложение по HTTPS и проверьте:
- вход;
- создание сообщений;
- realtime;
- уведомления;
- открытие страницы после обновления браузера.

## Настройка Supabase

1. Создайте новый проект в Supabase.
2. Откройте `SQL Editor`.
3. Выполните SQL из файла [`supabase/schema.sql`](./supabase/schema.sql).
4. Затем выполните [`supabase/organization-upgrade.sql`](./supabase/organization-upgrade.sql).
5. Затем выполните [`supabase/notifications-upgrade.sql`](./supabase/notifications-upgrade.sql).
   Если редактор Supabase режет большие вставки, используйте короткие файлы `organization_upgrade_part_1.sql` ... `organization_upgrade_part_7.sql` и `notifications_upgrade_part_1.sql` ... `notifications_upgrade_part_6.sql` по порядку.
6. В `Authentication` включите Email provider.
7. Для первого локального MVP откройте `Authentication -> Providers -> Email` и отключите `Confirm email`. Если подтверждение email включено, после регистрации пользователь увидит сообщение `Проверьте email для подтверждения аккаунта`.
8. В `Database > Replication` включите realtime для таблицы `messages`, если он не включен автоматически. Для `notifications` публикация добавляется миграцией.
9. Скопируйте `Project URL` и `anon public key` в `.env.local`.

## Основные файлы

- `src/App.tsx` - auth-flow, загрузка workspace и realtime-логика.
- `src/lib/supabase.ts` - typed Supabase client.
- `src/utils/workTime.ts` - логика смены.
- `src/utils/notificationRules.ts` - правила тихих и срочных уведомлений.
- `src/utils/memberStatus.ts` - отображаемый рабочий статус сотрудника.
- `src/utils/scheduledMessages.ts` - MVP-доставка запланированных сообщений.
- `src/components/*` - экраны и UI-компоненты.
- `supabase/schema.sql` - структура БД и базовые RLS policies.

## Следующий этап

- Безопасные RPC/Edge Functions для атомарной регистрации организации и присоединения сотрудника.
- Управление ролями и графиками из интерфейса.
- Push-уведомления поверх таблицы `notifications`.
- Доставка `next_shift` через Supabase Edge Function + cron вместо клиентской проверки.
- Обновление профиля и аватаров.
- Тесты и более строгий аудит RLS.
