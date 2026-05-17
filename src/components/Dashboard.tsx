import { Copy, LogOut, Menu, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';
import type {
  Chat,
  Department,
  MemberRole,
  MemberWithProfile,
  MessageWithProfile,
  Notification,
  Organization,
  Profile,
} from '../types/database';
import type { UiSettings } from '../utils/uiSettings';
import { getInterfaceSizeClasses, getSidebarWidthClasses } from '../utils/uiClasses';
import { ChatList } from './ChatList';
import { ChatView } from './ChatView';
import { MembersPanel } from './MembersPanel';
import { SettingsButton } from './SettingsButton';
import { SettingsPanel } from './SettingsPanel';
import { DepartmentsPanel } from './DepartmentsPanel';
import { CreateChatModal, type CreateChatInput } from './CreateChatModal';
import { MemberSettingsModal } from './MemberSettingsModal';
import { NotificationBell } from './NotificationBell';
import { StatusSelector } from './StatusSelector';
import type { AvailabilityStatus, DeliveryMode } from '../types/database';

interface DashboardProps {
  organization: Organization;
  currentUser: Profile;
  chats: Chat[];
  members: MemberWithProfile[];
  messages: MessageWithProfile[];
  scheduledMessages: MessageWithProfile[];
  notifications: Notification[];
  activeChatId: string | null;
  messagesLoading: boolean;
  departments: Department[];
  currentRole: MemberRole;
  settings: UiSettings;
  settingsError: string;
  onChatSelect: (chatId: string) => void;
  onSendMessage: (
    content: string,
    isUrgent: boolean,
    urgentReason: string,
    deliveryMode: DeliveryMode,
  ) => Promise<void>;
  onLogout: () => Promise<void>;
  onCreateDepartment: (name: string, description: string) => Promise<void>;
  onUpdateDepartment: (departmentId: string, name: string) => Promise<void>;
  onDeleteDepartment: (departmentId: string) => Promise<void>;
  onCreateChat: (input: CreateChatInput) => Promise<void>;
  onUpdateMember: (
    memberId: string,
    patch: {
      position: string;
      role: MemberRole;
      department_id: string | null;
      work_start: string;
      work_end: string;
    },
  ) => Promise<void>;
  onAcknowledge: (messageId: string) => Promise<void>;
  onStatusChange: (status: AvailabilityStatus, statusUntil: string | null) => Promise<void>;
  onNotificationClick: (notification: Notification) => Promise<void>;
  onMarkAllNotificationsRead: () => Promise<void>;
  onSettingsChange: <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => void;
  onSettingsReset: () => void;
}

export const Dashboard = ({
  organization,
  currentUser,
  chats,
  members,
  messages,
  scheduledMessages,
  notifications,
  activeChatId,
  messagesLoading,
  departments,
  currentRole,
  settings,
  settingsError,
  onChatSelect,
  onSendMessage,
  onLogout,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onCreateChat,
  onUpdateMember,
  onAcknowledge,
  onStatusChange,
  onNotificationClick,
  onMarkAllNotificationsRead,
  onSettingsChange,
  onSettingsReset,
}: DashboardProps) => {
  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? null;
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null);
  const sizeClasses = getInterfaceSizeClasses(settings);
  const sidebarClasses = getSidebarWidthClasses(settings);
  const canManage = currentRole === 'owner' || currentRole === 'admin';
  const canCreateChat = currentRole !== 'employee';
  const ownerCount = members.filter((member) => member.role === 'owner').length;
  const currentMember = members.find((member) => member.user_id === currentUser.id);

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(organization.invite_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Failed to copy invite code.', error);
    }
  };

  return (
    <div className={`app-surface min-h-screen lg:grid ${sidebarClasses.left} ${sizeClasses.root}`}>
      <button
        aria-label="Открыть меню"
        className="fixed left-4 top-4 z-30 rounded-lg bg-panel p-3 text-white shadow-soft lg:hidden"
        onClick={() => setSidebarOpen(true)}
        type="button"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col bg-panel px-4 py-5 text-white transition-transform lg:static lg:w-auto lg:min-h-screen lg:translate-x-0 lg:px-5 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <button
          aria-label="Закрыть меню"
          className="mb-4 self-end rounded-lg bg-white/10 p-2 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">OrgChat</p>
            <h1 className="mt-1 text-2xl font-semibold">{organization.name}</h1>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-white/10 p-3">
          <p className="text-xs uppercase text-slate-400">Код приглашения</p>
          <p className="mt-1 text-xl font-semibold tracking-wide">{organization.invite_code}</p>
          <button
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
            onClick={() => void copyInviteCode()}
            type="button"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>

        <div className="mb-6 rounded-lg bg-white/10 p-3">
          <p className="text-xs uppercase text-slate-400">Текущий пользователь</p>
          <p className="mt-1 font-medium">{currentUser.full_name}</p>
        </div>
        {currentMember ? <StatusSelector member={currentMember} onChange={onStatusChange} /> : null}

        <ChatList chats={chats} activeChatId={activeChatId} onSelect={onChatSelect} />
        {canCreateChat ? (
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-medium text-slate-950"
            onClick={() => setCreateChatOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Создать беседу
          </button>
        ) : null}

        <div className="mt-6">
          <DepartmentsPanel
            currentRole={currentRole}
            departments={departments}
            onCreate={onCreateDepartment}
            onDelete={onDeleteDepartment}
            onUpdate={onUpdateDepartment}
          />
        </div>

        <div className="mt-auto space-y-3 pt-6">
          <SettingsButton onClick={() => setSettingsOpen(true)} />
          <button
            className="inline-flex w-full items-center gap-3 rounded-lg bg-white/10 px-3 py-3 text-left text-white transition hover:bg-white/15"
            onClick={() => void onLogout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      <main className={`grid gap-4 p-4 pt-20 lg:p-6 lg:pt-6 ${sidebarClasses.right}`}>
        <div className="flex justify-end">
          <NotificationBell
            notifications={notifications}
            onMarkAllRead={onMarkAllNotificationsRead}
            onNotificationClick={onNotificationClick}
          />
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 font-medium lg:hidden"
          onClick={() => setMembersOpen((current) => !current)}
          type="button"
        >
          <Users className="h-4 w-4" />
          {membersOpen ? 'Скрыть сотрудников' : 'Показать сотрудников'}
        </button>
        <ChatView
          chat={activeChat}
          currentUser={currentUser}
          loading={messagesLoading}
          messages={messages}
          members={members.filter((member) => member.user_id !== currentUser.id)}
          scheduledMessages={scheduledMessages}
          currentRole={currentRole}
          memberCount={members.length}
          onAcknowledge={onAcknowledge}
          onSend={onSendMessage}
          settings={settings}
        />
        <div className={`${membersOpen ? 'block' : 'hidden'} lg:block`}>
          <MembersPanel
            canManage={canManage}
            members={members}
            onSelectMember={setSelectedMember}
            settings={settings}
          />
        </div>
      </main>

      <SettingsPanel
        error={settingsError}
        onChange={onSettingsChange}
        onClose={() => setSettingsOpen(false)}
        onReset={onSettingsReset}
        open={settingsOpen}
        settings={settings}
      />
      <CreateChatModal
        departments={departments}
        members={members}
        onClose={() => setCreateChatOpen(false)}
        onCreate={onCreateChat}
        open={createChatOpen}
      />
      <MemberSettingsModal
        canDemoteOwner={ownerCount > 1}
        departments={departments}
        editable={canManage}
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onSave={onUpdateMember}
      />
    </div>
  );
};
