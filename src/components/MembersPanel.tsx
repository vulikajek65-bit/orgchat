import type { MemberWithProfile } from '../types/database';
import type { UiSettings } from '../utils/uiSettings';
import { getInterfaceSizeClasses } from '../utils/uiClasses';
import { formatWorkTime } from '../utils/workTime';
import { MemberStatusBadge } from './MemberStatusBadge';

interface MembersPanelProps {
  members: MemberWithProfile[];
  settings: UiSettings;
  canManage: boolean;
  onSelectMember: (member: MemberWithProfile) => void;
}

export const MembersPanel = ({ members, settings, canManage, onSelectMember }: MembersPanelProps) => {
  const sizeClasses = getInterfaceSizeClasses(settings);

  return (
    <section className={`surface-card rounded-lg bg-white shadow-soft ${sizeClasses.panelPadding}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Сотрудники</h2>
        <span className="text-sm text-slate-500">{members.length}</span>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <article
            className={`surface-border cursor-pointer rounded-lg border border-slate-200 transition hover:border-brand-200 hover:bg-slate-50 ${sizeClasses.cardPadding}`}
            key={member.id}
            onClick={() => onSelectMember(member)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel text-sm font-semibold text-white">
                  {member.profile.avatar_url ? (
                    <img alt="" className="h-full w-full object-cover" src={member.profile.avatar_url} />
                  ) : (
                    member.profile.full_name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                <p className="font-medium">{member.profile.full_name}</p>
                {member.profile.personal_status ? (
                  <p className="truncate text-sm text-brand-700">{member.profile.personal_status}</p>
                ) : null}
                <p className="text-sm text-slate-500">
                  {member.position || 'Без должности'} · {roleLabel[member.role]}
                </p>
                <p className="mt-1 text-sm text-slate-500">{member.department?.name ?? 'Без отдела'}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-slate-500">
                {formatWorkTime(member.work_start)}–{formatWorkTime(member.work_end)}
              </span>
              <MemberStatusBadge member={member} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const roleLabel = {
  owner: 'Владелец',
  admin: 'Администратор',
  manager: 'Руководитель отдела',
  employee: 'Сотрудник',
};
