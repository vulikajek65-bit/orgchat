import type { Message, OrganizationMember } from '../types/database';
import { isUserWorkingNow } from './workTime';

export const shouldNotifyUser = (
  member: Pick<OrganizationMember, 'work_start' | 'work_end'>,
  message: Pick<Message, 'is_urgent'>,
) => message.is_urgent || isUserWorkingNow(member);
