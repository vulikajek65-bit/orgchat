import { ContactRound, MessageCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { MemberWithProfile, UserContact } from '../types/database';

interface ContactsPanelProps {
  contacts: UserContact[];
  members: MemberWithProfile[];
  currentUserId: string;
  onStartDirectChat: (userId: string) => Promise<void>;
}

export const ContactsPanel = ({
  contacts,
  members,
  currentUserId,
  onStartDirectChat,
}: ContactsPanelProps) => {
  const memberByProfileId = useMemo(
    () => new Map(members.map((member) => [member.user_id, member])),
    [members],
  );
  const visibleContacts = useMemo(
    () =>
      contacts
        .slice()
        .sort((left, right) => left.contact_name.localeCompare(right.contact_name))
        .slice(0, 6),
    [contacts],
  );

  return (
    <section className="mt-5 rounded-lg bg-white/10 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-slate-400">Контакты</h2>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{contacts.length}</span>
      </div>

      {visibleContacts.length ? (
        <div className="space-y-2">
          {visibleContacts.map((contact) => {
            const linkedMember = contact.linked_profile_id
              ? memberByProfileId.get(contact.linked_profile_id)
              : undefined;
            const canMessage = Boolean(
              linkedMember && linkedMember.user_id !== currentUserId,
            );

            return (
              <article className="rounded-lg bg-white/10 p-2" key={contact.id}>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-xs font-semibold text-white">
                    {linkedMember?.profile.avatar_url ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={linkedMember.profile.avatar_url}
                      />
                    ) : (
                      contact.contact_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{contact.contact_name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {linkedMember ? 'Есть в OrgChat' : contact.phone || contact.email || 'Не связан'}
                    </p>
                  </div>
                  <button
                    className="rounded-lg bg-white px-2 py-2 text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!canMessage}
                    onClick={() => linkedMember && void onStartDirectChat(linkedMember.user_id)}
                    title={canMessage ? 'Написать лично' : 'Контакт не найден среди сотрудников'}
                    type="button"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-lg bg-white/10 p-3 text-sm text-slate-300">
          <ContactRound className="h-4 w-4" />
          Контактов пока нет.
        </p>
      )}
    </section>
  );
};
