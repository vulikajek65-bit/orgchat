import { BellRing, BriefcaseBusiness, Building2, Hash, MessageCircle, Search, Siren } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Chat, ChatType } from '../types/database';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
}

export const ChatList = ({ chats, activeChatId, onSelect }: ChatListProps) => {
  const [query, setQuery] = useState('');
  const filteredChats = useMemo(
    () => chats.filter((chat) => chat.title.toLowerCase().includes(query.toLowerCase())),
    [chats, query],
  );

  return (
  <section className="rounded-lg bg-white p-4 shadow-soft lg:bg-transparent lg:p-0 lg:shadow-none">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase text-slate-500 lg:text-slate-400">Чаты</h2>
    </div>
    <label className="mb-3 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-500 lg:bg-white/10 lg:text-slate-300">
      <Search className="h-4 w-4" />
      <input
        className="w-full bg-transparent text-sm outline-none placeholder:text-current"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск"
        value={query}
      />
    </label>
    <div className="space-y-2">
      {filteredChats.map((chat) => (
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
            chat.id === activeChatId
              ? 'bg-brand-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 lg:bg-white/10 lg:text-white lg:hover:bg-white/15'
          }`}
          key={chat.id}
          onClick={() => onSelect(chat.id)}
          type="button"
        >
          {chatIcon[chat.type]}
          <span className="truncate">{chat.title}</span>
          <span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-[11px]">
            {chatLabel[chat.type]}
          </span>
        </button>
      ))}
    </div>
  </section>
  );
};

const chatLabel: Record<ChatType, string> = {
  general: 'Общий',
  department: 'Отдел',
  direct: 'Личный',
  project: 'Проект',
  urgent: 'Срочный',
  announcement: 'Объявления',
};

const chatIcon: Record<ChatType, ReactNode> = {
  general: <Hash className="h-4 w-4" />,
  department: <Building2 className="h-4 w-4" />,
  direct: <MessageCircle className="h-4 w-4" />,
  project: <BriefcaseBusiness className="h-4 w-4" />,
  urgent: <Siren className="h-4 w-4" />,
  announcement: <BellRing className="h-4 w-4" />,
};
