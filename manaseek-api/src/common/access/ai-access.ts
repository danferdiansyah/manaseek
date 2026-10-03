// Exact account allowlist. Keep this server-side; clients receive only their
// own permission. Gmail aliases and administrator roles do not grant access.
const AI_ALLOWED_EMAILS = new Set([
  'rizky2004cool@gmail.com',
  'manaseekindonesia@gmail.com',
  'rozan.faiq@gmail.com',
  'ismailshlh21@gmail.com',
  'danferdianstyle@gmail.com',
  'aakiki091004@gmail.com',
  'business.tasyahafizahputri@gmail.com',
]);

type AiIdentity = {
  email: string | null;
  emailVerifiedAt: Date | null;
  status: 'ACTIVE' | 'SUSPENDED';
};

export function canAccessAi(user: AiIdentity | null | undefined): boolean {
  return !!user?.email && !!user.emailVerifiedAt &&
    user.status === 'ACTIVE' &&
    AI_ALLOWED_EMAILS.has(user.email.trim().toLowerCase());
}
