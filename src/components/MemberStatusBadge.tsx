import type { OrganizationMember } from '../types/database';
import { getMemberDisplayStatus, getMemberDisplayStatusLabel } from '../utils/memberStatus';

interface MemberStatusBadgeProps {
  member: Pick<
    OrganizationMember,
    'availability_status' | 'status_until' | 'work_start' | 'work_end'
  >;
}

export const MemberStatusBadge = ({ member }: MemberStatusBadgeProps) => {
  const status = getMemberDisplayStatus(member);

  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className={`h-2.5 w-2.5 rounded-full ${statusColor[status]}`} />
      {getMemberDisplayStatusLabel(member)}
    </span>
  );
};

const statusColor = {
  working: 'bg-emerald-500',
  break: 'bg-yellow-400',
  busy: 'bg-orange-500',
  off: 'bg-slate-400',
  vacation: 'bg-violet-500',
};
