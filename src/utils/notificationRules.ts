import type { MemberWithProfile, Message } from '../types/database';
import { getMemberDisplayStatus } from './memberStatus';

const parseTime = (time?: string | null) => {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
};

export const shouldNotifyMember = (
  member: MemberWithProfile,
  message: Pick<Message, 'is_urgent'>,
) => message.is_urgent || getMemberDisplayStatus(member) === 'working';

export const shouldCreateSilentNotification = (
  member: MemberWithProfile,
  message: Pick<Message, 'is_urgent'>,
) => !message.is_urgent && getMemberDisplayStatus(member) !== 'working';

export const getNextWorkStart = (
  member: Pick<MemberWithProfile, 'work_start'>,
  now = new Date(),
) => {
  const start = parseTime(member.work_start);
  if (!start) {
    return null;
  }

  const nextStart = new Date(now);
  nextStart.setHours(start.hours, start.minutes, 0, 0);

  if (nextStart <= now) {
    nextStart.setDate(nextStart.getDate() + 1);
  }

  return nextStart;
};
