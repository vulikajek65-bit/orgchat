const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateInviteCode = (length = 8) =>
  Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
