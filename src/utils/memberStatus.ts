import type { AvailabilityStatus, OrganizationMember } from '../types/database';
import { formatShiftStatus, isUserWorkingNow } from './workTime';

export type MemberDisplayStatus = Exclude<AvailabilityStatus, 'auto'>;

export const getMemberDisplayStatus = (
  member: Pick<
    OrganizationMember,
    'availability_status' | 'status_until' | 'work_start' | 'work_end'
  >,
  now = new Date(),
): MemberDisplayStatus => {
  const availabilityStatus = member.availability_status ?? 'auto';
  const manualStatusActive =
    availabilityStatus !== 'auto' &&
    (!member.status_until || new Date(member.status_until) > now);

  if (manualStatusActive) {
    return availabilityStatus;
  }

  return isUserWorkingNow(member, now) ? 'working' : 'off';
};

export const getMemberDisplayStatusLabel = (
  member: Pick<
    OrganizationMember,
    'availability_status' | 'status_until' | 'work_start' | 'work_end'
  >,
  now = new Date(),
) => {
  const status = getMemberDisplayStatus(member, now);

  if (status === 'working') {
    return (member.availability_status ?? 'auto') === 'auto'
      ? formatShiftStatus(member, now)
      : 'На смене';
  }

  return {
    break: 'Перерыв',
    busy: 'Занят',
    off: 'Не на смене',
    vacation: 'Отпуск',
  }[status];
};
