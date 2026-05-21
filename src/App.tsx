import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { AuthLanding } from './components/AuthLanding';
import { Login } from './components/Login';
import { RegisterEmployee, type EmployeeRegistrationInput } from './components/RegisterEmployee';
import { RegisterOwner, type OwnerRegistrationInput } from './components/RegisterOwner';
import { Dashboard } from './components/Dashboard';
import { ensureSupabaseConfigured, supabase, supabaseConfigError } from './lib/supabase';
import type {
  Chat,
  Department,
  DeliveryMode,
  MemberRole,
  MessageAttachment,
  MemberWithProfile,
  Message,
  MessageWithProfile,
  Notification,
  Organization,
  Profile,
  UserContact,
} from './types/database';
import { generateInviteCode } from './utils/inviteCode';
import {
  loadUiSettings,
  resetUiSettings,
  saveUiSettings,
  type UiSettings,
} from './utils/uiSettings';
import {
  getNextWorkStart,
  shouldCreateSilentNotification,
  shouldNotifyMember,
} from './utils/notificationRules';
import { deliverDueScheduledMessages } from './utils/scheduledMessages';
import type { AvailabilityStatus } from './types/database';

type AuthScreen = 'landing' | 'login' | 'owner' | 'employee';

const friendlyError = (fallback: string, error?: { message?: string } | null) => {
  if (!error?.message) {
    return fallback;
  }

  if (error.message.toLowerCase().includes('invalid login credentials')) {
    return 'Неверный email или пароль.';
  }

  if (error.message.toLowerCase().includes('user already registered')) {
    return 'Пользователь с таким email уже существует.';
  }

  return fallback;
};

const getAttachmentKind = (mimeType: string, fileName: string): MessageAttachment['kind'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$/i.test(fileName)
  ) {
    return 'document';
  }
  return 'file';
};

const App = () => {
  const [screen, setScreen] = useState<AuthScreen>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<MessageWithProfile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contacts, setContacts] = useState<UserContact[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [ownerRegistrationStep, setOwnerRegistrationStep] = useState('');
  const [ownerRegistrationError, setOwnerRegistrationError] = useState('');
  const [ownerRegistrationInProgress, setOwnerRegistrationInProgress] = useState(false);
  const [uiSettings, setUiSettings] = useState<UiSettings>(() => loadUiSettings());
  const [uiSettingsError, setUiSettingsError] = useState('');

  useEffect(() => {
    if (supabaseConfigError) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadWorkspace = useCallback(async (userId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setWorkspaceLoading(true);
    }
    setWorkspaceError('');

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Failed to load profile.', profileError);
        throw new Error('Не удалось загрузить профиль.');
      }

      const { data: membershipData, error: membershipError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      setProfile(profileData);

      if (membershipError) {
        console.error('Failed to load membership.', membershipError);
        throw new Error('Не удалось загрузить участие в организации.');
      }

      if (!membershipData) {
        setOrganization(null);
        setMembers([]);
        setChats([]);
        setDepartments([]);
        setActiveChatId(null);
        setMessages([]);
        setContacts([]);
        return;
      }

      const [
        { data: organizationData, error: organizationError },
        { data: memberRows, error: membersError },
        { data: chatRows, error: chatsError },
        { data: departmentRows, error: departmentsError },
      ] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', membershipData.organization_id).single(),
        supabase.from('organization_members').select('*').eq('organization_id', membershipData.organization_id),
        supabase
          .from('chats')
          .select('*')
          .eq('organization_id', membershipData.organization_id)
          .order('created_at', { ascending: true }),
        supabase
          .from('departments')
          .select('*')
          .eq('organization_id', membershipData.organization_id)
          .order('name', { ascending: true }),
      ]);

      if (
        organizationError ||
        membersError ||
        chatsError ||
        departmentsError ||
        !organizationData ||
        !memberRows ||
        !chatRows ||
        !departmentRows
      ) {
        console.error('Failed to load workspace.', {
          organizationError,
          membersError,
          chatsError,
          departmentsError,
        });
        throw new Error('Не удалось загрузить данные организации.');
      }

      const profileIds = memberRows.map((member) => member.user_id);
      const { data: profileRows, error: profileRowsError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', profileIds);

      if (profileRowsError) {
        console.error('Failed to load member profiles.', profileRowsError);
        throw new Error('Не удалось загрузить профили сотрудников.');
      }

      const profileMap = new Map((profileRows ?? []).map((item) => [item.id, item]));
      const departmentMap = new Map(departmentRows.map((department) => [department.id, department]));

      setOrganization(organizationData);
      setDepartments(departmentRows);
      setMembers(
        memberRows
          .map((member) => ({
            ...member,
            profile: profileMap.get(member.user_id),
            department: member.department_id ? departmentMap.get(member.department_id) ?? null : null,
          }))
          .filter((member): member is MemberWithProfile => Boolean(member.profile)),
      );
      setChats(chatRows);
      setActiveChatId((current) =>
        current && chatRows.some((chat) => chat.id === current) ? current : chatRows[0]?.id ?? null,
      );
    } catch (error) {
      console.error('Workspace load failed.', error);
      setWorkspaceError(
        error instanceof Error ? error.message : 'Не удалось загрузить рабочее пространство.',
      );
    } finally {
      if (!silent) {
        setWorkspaceLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (ownerRegistrationInProgress) {
      return;
    }

    if (!session?.user.id) {
      setProfile(null);
      setOrganization(null);
      setMembers([]);
      setChats([]);
      setDepartments([]);
      setMessages([]);
      setContacts([]);
      return;
    }

    void loadWorkspace(session.user.id);
  }, [loadWorkspace, ownerRegistrationInProgress, session?.user.id]);

  const loadMessages = useCallback(async (chatId: string) => {
    setMessagesLoading(true);

    try {
      const { data: messageRows, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_delivered', true)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Failed to load messages.', messagesError);
        throw new Error('Не удалось загрузить сообщения.');
      }

      const senderIds = [...new Set((messageRows ?? []).map((message) => message.sender_id))];
      const messageIds = (messageRows ?? []).map((message) => message.id);
      const [
        { data: senderRows, error: senderRowsError },
        { data: acknowledgementRows, error: acknowledgementsError },
        { data: attachmentRows, error: attachmentsError },
      ] =
        await Promise.all([
          senderIds.length
        ? await supabase.from('profiles').select('*').in('id', senderIds)
        : { data: [] as Profile[], error: null },
          messageIds.length
            ? await supabase.from('message_acknowledgements').select('*').in('message_id', messageIds)
            : { data: [], error: null },
          messageIds.length
            ? await supabase.from('message_attachments').select('*').in('message_id', messageIds)
            : { data: [], error: null },
        ]);

      if (senderRowsError || acknowledgementsError) {
        console.error('Failed to load message relations.', {
          senderRowsError,
          acknowledgementsError,
        });
        throw new Error('Не удалось загрузить отправителей сообщений.');
      }

      if (attachmentsError) {
        console.error('Failed to load message attachments.', {
          attachmentsError,
          hint: 'Выполните supabase/media-upgrade.sql, чтобы включить вложения.',
        });
      }

      const senderMap = new Map((senderRows ?? []).map((sender) => [sender.id, sender]));
      const safeAttachmentRows = (attachmentsError ? [] : (attachmentRows ?? [])) as MessageAttachment[];

      setMessages(
        (messageRows ?? [])
          .map((message) => ({
            ...message,
            sender: senderMap.get(message.sender_id),
            acknowledgements: (acknowledgementRows ?? []).filter(
              (acknowledgement) => acknowledgement.message_id === message.id,
            ),
            attachments: safeAttachmentRows.filter(
              (attachment) => attachment.message_id === message.id,
            ),
          }))
          .filter((message): message is MessageWithProfile => Boolean(message.sender)),
      );
    } catch (error) {
      console.error('Message load failed.', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadScheduledMessages = useCallback(
    async (chatId: string, userId: string) => {
      try {
        const { data: messageRows, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .eq('sender_id', userId)
          .eq('is_delivered', false)
          .order('scheduled_for', { ascending: true });

        if (error) {
          console.error('Failed to load scheduled messages.', error);
          throw new Error('Не удалось загрузить запланированные сообщения.');
        }

        setScheduledMessages(
          (messageRows ?? []).map((message) => ({
            ...message,
            sender: profile as Profile,
            acknowledgements: [],
            attachments: [],
          })),
        );
      } catch (error) {
        console.error('Scheduled messages load failed.', error);
        setScheduledMessages([]);
      }
    },
    [profile],
  );

  const loadNotifications = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load notifications.', error);
        throw new Error('Не удалось загрузить уведомления.');
      }

      setNotifications(data ?? []);
    } catch (error) {
      console.error('Notifications load failed.', error);
      setNotifications([]);
    }
  }, []);

  const loadContacts = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_contacts')
        .select('*')
        .eq('owner_id', userId)
        .order('contact_name', { ascending: true });

      if (error) {
        console.error('Failed to load contacts.', error);
        throw new Error('Не удалось загрузить контакты.');
      }

      setContacts(data ?? []);
    } catch (error) {
      console.error('Contacts load failed.', error);
      setContacts([]);
    }
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      setScheduledMessages([]);
      return;
    }

    void loadMessages(activeChatId);
    if (session?.user.id) {
      void loadScheduledMessages(activeChatId, session.user.id);
    }

    const channel = supabase
      .channel(`messages:${activeChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChatId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          if (!newMessage.is_delivered) {
            return;
          }
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          if (sender) {
            if (import.meta.env.DEV) {
              console.info('New message received', newMessage);
            }
            setMessages((current) =>
              current.some((message) => message.id === newMessage.id)
                ? current
                : [...current, { ...newMessage, sender, acknowledgements: [], attachments: [] }],
            );
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${activeChatId}`,
        },
        async (payload) => {
          const updatedMessage = payload.new as Message;
          if (!updatedMessage.is_delivered) {
            return;
          }

          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', updatedMessage.sender_id)
            .single();

          if (sender) {
            setMessages((current) =>
              current.some((message) => message.id === updatedMessage.id)
                ? current.map((message) =>
                    message.id === updatedMessage.id
                      ? { ...message, ...updatedMessage, sender }
                      : message,
                  )
                : [...current, { ...updatedMessage, sender, acknowledgements: [], attachments: [] }],
            );
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_attachments',
          filter: `chat_id=eq.${activeChatId}`,
        },
        async () => {
          await loadMessages(activeChatId);
        },
      )
      .subscribe((status) => {
        if (import.meta.env.DEV && status === 'SUBSCRIBED') {
          console.info('Realtime connected');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeChatId, loadMessages, loadScheduledMessages, session?.user.id]);

  useEffect(() => {
    if (!session?.user.id) {
      setNotifications([]);
      return;
    }

    void loadNotifications(session.user.id);
    void loadContacts(session.user.id);

    const channel = supabase
      .channel(`notifications:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          setNotifications((current) =>
            current.some((item) => item.id === notification.id)
              ? current
              : [notification, ...current],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadContacts, loadNotifications, session?.user.id]);

  useEffect(() => {
    if (!session?.user.id) {
      return;
    }

    void deliverDueScheduledMessages(supabase, session.user.id)
      .then(async (deliveredMessages) => {
        for (const deliveredMessage of deliveredMessages) {
          await createNotificationsForMessage(deliveredMessage, deliveredMessage.chat_id, session.user.id);
        }
        if (activeChatId) {
          await loadMessages(activeChatId);
          await loadScheduledMessages(activeChatId, session.user.id);
        }
      })
      .catch((error) => console.error('Scheduled delivery check failed.', error));
  }, [activeChatId, loadMessages, loadScheduledMessages, session?.user.id]);

  useEffect(() => {
    if (!organization?.id || !session?.user.id) {
      return;
    }

    const channel = supabase
      .channel(`members:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${organization.id}`,
        },
        async () => {
          if (import.meta.env.DEV) {
            console.info('New organization member received');
          }
          await loadWorkspace(session.user.id, { silent: true });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${organization.id}`,
        },
        async () => {
          if (import.meta.env.DEV) {
            console.info('Organization member updated');
          }
          await loadWorkspace(session.user.id, { silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadWorkspace, organization?.id, session?.user.id]);

  const createProfile = async (userId: string, fullName: string) => {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
    });

    if (error) {
      console.error('Failed to create profile.', error);
      throw error;
    }
  };

  const registerOwner = async (input: OwnerRegistrationInput) => {
    setOwnerRegistrationInProgress(true);
    setOwnerRegistrationError('');

    try {
      ensureSupabaseConfigured();
      setOwnerRegistrationStep('регистрация пользователя');

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (signUpError) {
        console.error('Owner sign up failed.', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Пользователь не создан.');
      }

      if (!authData.session) {
        throw new Error('Проверьте email для подтверждения аккаунта.');
      }

      const userId = authData.user.id;

      setOwnerRegistrationStep('создание профиля');
      await createProfile(userId, input.fullName);

      setOwnerRegistrationStep('создание организации');
      const inviteCode = generateInviteCode();
      const { data: organizationData, error: organizationError } = await supabase
        .from('organizations')
        .insert({
          name: input.organizationName,
          owner_id: userId,
          invite_code: inviteCode,
          default_work_start: input.workStart,
          default_work_end: input.workEnd,
        })
        .select('*')
        .single();

      if (organizationError) {
        console.error('Failed to create organization.', organizationError);
        throw organizationError;
      }

      if (!organizationData) {
        throw new Error('Организация не создана.');
      }

      setOwnerRegistrationStep('добавление владельца в организацию');
      const { error: membershipError } = await supabase.from('organization_members').insert({
        organization_id: organizationData.id,
        user_id: userId,
        role: 'owner',
        position: input.position,
        work_start: input.workStart,
        work_end: input.workEnd,
      });

      if (membershipError) {
        console.error('Failed to create owner membership.', membershipError);
        throw membershipError;
      }

      setOwnerRegistrationStep('создание общего чата');
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          organization_id: organizationData.id,
          title: 'Общий чат',
          type: 'general',
          created_by: userId,
        })
        .select('*')
        .single();

      if (chatError) {
        console.error('Failed to create general chat.', chatError);
        throw chatError;
      }

      if (!chatData) {
        throw new Error('Общий чат не создан.');
      }

      setOwnerRegistrationStep('добавление владельца в чат');
      const { error: chatMembershipError } = await supabase.from('chat_members').insert({
        chat_id: chatData.id,
        user_id: userId,
      });

      if (chatMembershipError) {
        console.error('Failed to create owner chat membership.', chatMembershipError);
        throw chatMembershipError;
      }

      setOwnerRegistrationStep('загрузка dashboard');
    await loadWorkspace(userId);
      setOwnerRegistrationStep('готово');
    } catch (registrationError) {
      console.error('Owner registration failed.', registrationError);
      const message =
        registrationError instanceof Error
          ? friendlyError(registrationError.message, registrationError)
          : 'Не удалось создать организацию.';
      setOwnerRegistrationError(message);
      throw new Error(message);
    } finally {
      setOwnerRegistrationInProgress(false);
    }
  };

  const registerEmployee = async (input: EmployeeRegistrationInput) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (error || !data.user) {
        console.error('Employee sign up failed.', error);
        throw new Error(friendlyError('Не удалось зарегистрировать сотрудника.', error));
      }

      if (!data.session) {
        throw new Error('Проверьте email для подтверждения аккаунта.');
      }

      const { data: organizationData, error: organizationError } = await supabase
        .from('organizations')
        .select('*')
        .eq('invite_code', input.inviteCode)
        .maybeSingle();

      if (organizationError) {
        console.error('Failed to find organization by invite code.', organizationError);
        throw new Error('Не удалось проверить код организации.');
      }

      if (!organizationData) {
        throw new Error('Организация с таким кодом не найдена.');
      }

      await createProfile(data.user.id, input.fullName);

      const { error: membershipError } = await supabase.from('organization_members').insert({
        organization_id: organizationData.id,
        user_id: data.user.id,
        role: 'employee',
        position: input.position,
        work_start: input.workStart,
        work_end: input.workEnd,
      });

      if (membershipError) {
        console.error('Failed to create employee membership.', membershipError);
        throw new Error('Не удалось добавить сотрудника в организацию.');
      }

      const { data: generalChat, error: generalChatError } = await supabase
        .from('chats')
        .select('*')
        .eq('organization_id', organizationData.id)
        .eq('type', 'general')
        .limit(1)
        .maybeSingle();

      if (generalChatError) {
        console.error('Failed to load general chat.', generalChatError);
        throw new Error('Не удалось найти общий чат организации.');
      }

      if (!generalChat) {
        throw new Error('Общий чат организации не найден.');
      }

      const { error: chatMembershipError } = await supabase.from('chat_members').insert({
        chat_id: generalChat.id,
        user_id: data.user.id,
      });

      if (chatMembershipError) {
        console.error('Failed to create employee chat membership.', chatMembershipError);
        throw new Error('Не удалось добавить сотрудника в общий чат.');
      }

      await loadWorkspace(data.user.id);
    } catch (error) {
      console.error('Employee registration failed.', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(friendlyError('Не удалось войти.', error));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setScreen('landing');
  };

  const sendMessage = async (
    content: string,
    isUrgent: boolean,
    urgentReason: string,
    deliveryMode: DeliveryMode,
    attachments: File[] = [],
  ) => {
    if (!session?.user.id || !activeChatId) {
      throw new Error('Чат пока недоступен.');
    }

    const currentMember = members.find((member) => member.user_id === session.user.id);
    if (!currentMember) {
      throw new Error('Не удалось определить ваш рабочий профиль.');
    }

    const scheduledFor =
      deliveryMode === 'next_shift' ? getNextWorkStart(currentMember)?.toISOString() ?? null : null;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id: activeChatId,
        sender_id: session.user.id,
        content: content || (attachments.length ? 'Вложение' : ''),
        is_urgent: isUrgent,
        urgent_reason: isUrgent ? urgentReason : null,
        delivery_mode: deliveryMode,
        scheduled_for: scheduledFor,
        is_delivered: deliveryMode === 'now',
      })
      .select('*')
      .single();

    if (error || !message) {
      console.error('Failed to insert message.', error);
      throw new Error('Не удалось отправить сообщение.');
    }

    if (attachments.length) {
      const attachmentRows = [];
      for (const file of attachments) {
        const safeName = file.name.replace(/[^\w.\-а-яА-ЯёЁ ]/g, '_');
        const filePath = `${session.user.id}/${activeChatId}/${message.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          });

        if (uploadError) {
          console.error('Failed to upload attachment.', uploadError);
          throw new Error('Сообщение создано, но вложение не загрузилось.');
        }

        const { data } = supabase.storage.from('message-attachments').getPublicUrl(filePath);
        attachmentRows.push({
          message_id: message.id,
          chat_id: activeChatId,
          uploader_id: session.user.id,
          file_name: file.name,
          file_path: filePath,
          file_url: data.publicUrl,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          kind: getAttachmentKind(file.type || '', file.name),
        });
      }

      const { error: attachmentError } = await supabase.from('message_attachments').insert(attachmentRows);
      if (attachmentError) {
        console.error('Failed to create attachment rows.', attachmentError);
        throw new Error('Сообщение создано, но вложения не сохранились.');
      }
    }

    if (deliveryMode === 'next_shift') {
      await loadScheduledMessages(activeChatId, session.user.id);
      return;
    }

    await loadMessages(activeChatId);
    await createNotificationsForMessage(message, activeChatId, session.user.id);
  };

  const createNotificationsForMessage = async (
    message: Message,
    chatId: string,
    senderId: string,
  ) => {
    const { data: chatMemberRows, error: chatMembersError } = await supabase
      .from('chat_members')
      .select('user_id')
      .eq('chat_id', chatId);

    if (chatMembersError) {
      console.error('Failed to load chat members for notifications.', chatMembersError);
      throw new Error('Сообщение отправлено, но уведомления не созданы.');
    }

    const recipients = members.filter(
      (member) =>
        member.user_id !== senderId &&
        (chatMemberRows ?? []).some((chatMember) => chatMember.user_id === member.user_id),
    );

    const activeChat = chats.find((chat) => chat.id === chatId);
    const notificationRows = recipients.map((member) => {
      const isSilent = shouldCreateSilentNotification(member, message);
      const nextWorkStart = isSilent ? getNextWorkStart(member)?.toISOString() ?? null : null;
      const shouldNotify = shouldNotifyMember(member, message);

      return {
        organization_id: member.organization_id,
        user_id: member.user_id,
        chat_id: chatId,
        message_id: message.id,
        type:
          activeChat?.type === 'announcement'
            ? ('announcement' as const)
            : message.is_urgent
              ? ('urgent_message' as const)
              : ('message' as const),
        title: message.is_urgent
          ? 'Срочное сообщение'
          : shouldNotify
            ? 'Новое сообщение'
            : 'Новое сообщение ожидает начала смены',
        body: message.is_urgent
          ? `${message.content} Причина: ${message.urgent_reason}`
          : message.content,
        is_silent: isSilent,
        scheduled_for: nextWorkStart,
      };
    });

    if (notificationRows.length) {
      const { error: notificationError } = await supabase.from('notifications').insert(notificationRows);
      if (notificationError) {
        console.error('Failed to create notifications.', notificationError);
        throw new Error('Сообщение отправлено, но уведомления не созданы.');
      }
    }
  };

  const currentMembership = members.find((member) => member.user_id === session?.user.id);

  const createDepartment = async (name: string, description: string) => {
    if (!organization || !session?.user.id) {
      throw new Error('Организация недоступна.');
    }
    const { error } = await supabase.from('departments').insert({
      organization_id: organization.id,
      name,
      description,
      created_by: session.user.id,
    });
    if (error) {
      console.error('Failed to insert department.', error);
      throw new Error('Не удалось создать отдел.');
    }
    await loadWorkspace(session.user.id, { silent: true });
  };

  const updateDepartment = async (departmentId: string, name: string) => {
    const { error } = await supabase.from('departments').update({ name }).eq('id', departmentId);
    if (error) {
      console.error('Failed to update department.', error);
      throw new Error('Не удалось изменить отдел.');
    }
    if (session?.user.id) await loadWorkspace(session.user.id, { silent: true });
  };

  const deleteDepartment = async (departmentId: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', departmentId);
    if (error) {
      console.error('Failed to delete department.', error);
      throw new Error('Не удалось удалить отдел.');
    }
    if (session?.user.id) await loadWorkspace(session.user.id, { silent: true });
  };

  const createChat = async (input: {
    title: string;
    type: Chat['type'];
    departmentId: string | null;
    description: string;
    participantIds: string[];
  }) => {
    if (!organization || !session?.user.id) {
      throw new Error('Организация недоступна.');
    }
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        organization_id: organization.id,
        title: input.title,
        type: input.type,
        created_by: session.user.id,
        department_id: input.departmentId,
        description: input.description,
      })
      .select('*')
      .single();
    if (error || !chat) {
      console.error('Failed to create chat.', error);
      throw new Error('Не удалось создать беседу.');
    }
    const departmentUsers =
      input.type === 'department' && input.departmentId
        ? members.filter((member) => member.department_id === input.departmentId).map((member) => member.user_id)
        : [];
    const userIds = [...new Set([session.user.id, ...input.participantIds, ...departmentUsers])];
    const { error: membersError } = await supabase
      .from('chat_members')
      .insert(userIds.map((user_id) => ({ chat_id: chat.id, user_id })));
    if (membersError) {
      console.error('Failed to add chat members.', membersError);
      throw new Error('Не удалось добавить участников беседы.');
    }
    await loadWorkspace(session.user.id, { silent: true });
    setActiveChatId(chat.id);
  };

  const updateMember = async (
    memberId: string,
    patch: {
      position: string;
      role: MemberRole;
      department_id: string | null;
      work_start: string;
      work_end: string;
    },
  ) => {
    const { error } = await supabase.from('organization_members').update(patch).eq('id', memberId);
    if (error) {
      console.error('Failed to update organization member.', error);
      throw new Error('Не удалось обновить сотрудника.');
    }
    if (session?.user.id) await loadWorkspace(session.user.id, { silent: true });
  };

  const acknowledgeMessage = async (messageId: string) => {
    if (!session?.user.id) {
      throw new Error('Пользователь не найден.');
    }
    const { error } = await supabase.from('message_acknowledgements').insert({
      message_id: messageId,
      user_id: session.user.id,
    });
    if (error) {
      console.error('Failed to acknowledge message.', error);
      throw new Error('Не удалось подтвердить объявление.');
    }
    if (activeChatId) await loadMessages(activeChatId);
  };

  const updateOwnStatus = async (status: AvailabilityStatus, statusUntil: string | null) => {
    const member = members.find((item) => item.user_id === session?.user.id);
    if (!member || !session?.user.id) {
      throw new Error('Не удалось найти ваш профиль сотрудника.');
    }

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ availability_status: status, status_until: statusUntil })
        .eq('id', member.id);

      if (error) {
        console.error('Failed to update own availability status.', error);
        throw new Error('Не удалось изменить статус.');
      }

      await loadWorkspace(session.user.id, { silent: true });
    } catch (error) {
      console.error('Own status update failed.', error);
      throw error;
    }
  };

  const saveProfile = async (
    patch: Pick<Profile, 'full_name' | 'avatar_url' | 'birth_date' | 'personal_status' | 'phone'>,
  ) => {
    if (!session?.user.id) {
      throw new Error('Пользователь не найден.');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', session.user.id)
        .select('*')
        .single();

      if (error || !data) {
        console.error('Failed to update profile.', error);
        throw new Error('Не удалось сохранить профиль.');
      }

      setProfile(data);
      await loadWorkspace(session.user.id, { silent: true });
    } catch (error) {
      console.error('Profile save failed.', error);
      throw error;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!session?.user.id) {
      throw new Error('Пользователь не найден.');
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'png';
    const path = `${session.user.id}/${Date.now()}.${safeExtension}`;

    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.error('Failed to upload avatar.', error);
      throw new Error('Не удалось загрузить аватар.');
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  };

  const importContacts = async (
    importedContacts: Array<{ name: string; phone?: string | null; email?: string | null }>,
  ) => {
    if (!session?.user.id || !organization?.id) {
      throw new Error('Организация недоступна.');
    }

    const rows = importedContacts
      .map((contact) => ({
        owner_id: session.user.id,
        organization_id: organization.id,
        contact_name: contact.name.trim() || 'Контакт',
        phone: contact.phone?.trim() || null,
        email: contact.email?.trim() || null,
        source: 'phonebook',
      }))
      .filter((contact) => contact.phone || contact.email || contact.contact_name);

    if (!rows.length) {
      return;
    }

    const { error } = await supabase.from('user_contacts').insert(rows);
    if (error) {
      console.error('Failed to import contacts.', error);
      throw new Error('Не удалось сохранить контакты.');
    }

    await loadContacts(session.user.id);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
        if (error) {
          console.error('Failed to mark notification read.', error);
          throw new Error('Не удалось отметить уведомление прочитанным.');
        }
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
      }
      if (notification.chat_id) {
        setActiveChatId(notification.chat_id);
      }
    } catch (error) {
      console.error('Notification click failed.', error);
      throw error;
    }
  };

  const markAllNotificationsRead = async () => {
    if (!session?.user.id) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Failed to mark all notifications read.', error);
        throw new Error('Не удалось отметить уведомления прочитанными.');
      }

      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    } catch (error) {
      console.error('Mark all notifications failed.', error);
      throw error;
    }
  };

  const updateUiSetting = <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => {
    try {
      const nextSettings = { ...uiSettings, [key]: value };
      saveUiSettings(nextSettings);
      setUiSettings(nextSettings);
      setUiSettingsError('');
    } catch (error) {
      console.error('Failed to update UI settings.', error);
      setUiSettingsError(
        error instanceof Error ? error.message : 'Не удалось сохранить настройки интерфейса.',
      );
    }
  };

  const resetSettings = () => {
    try {
      const nextSettings = resetUiSettings();
      setUiSettings(nextSettings);
      setUiSettingsError('');
    } catch (error) {
      console.error('Failed to reset UI settings.', error);
      setUiSettingsError(
        error instanceof Error ? error.message : 'Не удалось сбросить настройки интерфейса.',
      );
    }
  };

  if (!authReady) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          Загружаем OrgChat...
        </div>
      </Layout>
    );
  }

  if (!session && supabaseConfigError) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
          <div className="rounded-lg bg-white p-6 shadow-soft">
            <h1 className="text-xl font-semibold">OrgChat не настроен</h1>
            <p className="mt-2 text-sm text-rose-600">{supabaseConfigError}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (session && workspaceLoading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          Загружаем рабочее пространство...
        </div>
      </Layout>
    );
  }

  if (session && workspaceError) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
          <div className="rounded-lg bg-white p-6 shadow-soft">
            <h1 className="text-xl font-semibold">Что-то пошло не так</h1>
            <p className="mt-2 text-sm text-slate-500">{workspaceError}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (session && profile && organization) {
    return (
      <Layout settings={uiSettings}>
        <Dashboard
          activeChatId={activeChatId}
          chats={chats}
          currentRole={currentMembership?.role ?? 'employee'}
          currentUser={profile}
          departments={departments}
          members={members}
          messages={messages}
          scheduledMessages={scheduledMessages}
          notifications={notifications}
          contacts={contacts}
          messagesLoading={messagesLoading}
          onChatSelect={setActiveChatId}
          onLogout={logout}
          onAcknowledge={acknowledgeMessage}
          onCreateChat={createChat}
          onCreateDepartment={createDepartment}
          onDeleteDepartment={deleteDepartment}
          onSendMessage={sendMessage}
          onStatusChange={updateOwnStatus}
          onNotificationClick={handleNotificationClick}
          onMarkAllNotificationsRead={markAllNotificationsRead}
          onImportContacts={importContacts}
          onSaveProfile={saveProfile}
          onUploadAvatar={uploadAvatar}
          onSettingsChange={updateUiSetting}
          onSettingsReset={resetSettings}
          onUpdateDepartment={updateDepartment}
          onUpdateMember={updateMember}
          organization={organization}
          settings={uiSettings}
          settingsError={uiSettingsError}
        />
      </Layout>
    );
  }

  if (session && profile && !organization) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4">
          <div className="rounded-lg bg-white p-6 shadow-soft">
            <h1 className="text-2xl font-semibold">Организация не найдена</h1>
            <p className="mt-2 text-sm text-slate-500">
              Аккаунт есть, но вы пока не состоите ни в одной организации.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-lg bg-brand-600 px-4 py-3 font-medium text-white" onClick={() => setScreen('owner')} type="button">
                Создать организацию
              </button>
              <button className="rounded-lg border border-slate-200 px-4 py-3 font-medium" onClick={() => setScreen('employee')} type="button">
                Присоединиться по коду
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {screen === 'landing' ? (
        <AuthLanding
          onEmployeeClick={() => setScreen('employee')}
          onLoginClick={() => setScreen('login')}
          onOwnerClick={() => setScreen('owner')}
        />
      ) : null}
      {screen === 'login' ? <Login onBack={() => setScreen('landing')} onSubmit={login} /> : null}
      {screen === 'owner' ? (
        <RegisterOwner
          latestError={ownerRegistrationError}
          onBack={() => setScreen('landing')}
          onSubmit={registerOwner}
          step={ownerRegistrationStep}
        />
      ) : null}
      {screen === 'employee' ? (
        <RegisterEmployee onBack={() => setScreen('landing')} onSubmit={registerEmployee} />
      ) : null}
    </Layout>
  );
};

export default App;
