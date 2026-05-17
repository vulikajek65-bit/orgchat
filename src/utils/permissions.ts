import type { ChatType, MemberRole } from '../types/database';

export const canSendMessage = (userRole: MemberRole, chatType: ChatType) => {
  if (userRole === 'owner' || userRole === 'admin') {
    return true;
  }

  if (userRole === 'manager') {
    return ['general', 'department', 'project', 'urgent', 'announcement'].includes(chatType);
  }

  return ['general', 'department', 'project', 'urgent'].includes(chatType);
};
