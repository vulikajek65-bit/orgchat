import type { OrganizationMember } from '../types/database';

export const toMinutes = (time?: string | null) => {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatWorkTime = (time?: string | null) => (time ? time.slice(0, 5) : 'Не указан');

export const isUserWorkingNow = (
  member: Pick<OrganizationMember, 'work_start' | 'work_end'>,
  now = new Date(),
) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(member.work_start);
  const endMinutes = toMinutes(member.work_end);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
};

export const formatShiftStatus = (
  member: Pick<OrganizationMember, 'work_start' | 'work_end'>,
  now = new Date(),
) =>
  isUserWorkingNow(member, now)
    ? `На смене до ${formatWorkTime(member.work_end)}`
    : 'Не на смене';
