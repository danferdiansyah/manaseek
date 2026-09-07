/**
 * Notification copy lives here rather than inline at call sites so product and
 * ops can review every message a jamaah can receive in one place.
 *
 * Copy is Indonesian: that is the primary language of our users.
 */
export interface NotificationTemplate {
  title: string;
  body: string;
}

type TemplateFn = (vars: Record<string, string>) => NotificationTemplate;

const interpolate = (template: string, vars: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (_match, key: string) => vars[key] ?? `{${key}}`);

const define = (title: string, body: string): TemplateFn => (vars) => ({
  title: interpolate(title, vars),
  body: interpolate(body, vars),
});

export const NotificationTemplates = {
  'booking.requested': define(
    'Permintaan pendampingan baru',
    '{jamaahName} meminta {serviceLabel} pada {schedule}. Konfirmasi sebelum {expiresAt}.',
  ),
  'booking.accepted': define(
    'Mutawif menerima pesanan Anda',
    '{mutawifName} akan mendampingi Anda pada {schedule}. Titik temu: {meetingPoint}.',
  ),
  'booking.rejected': define(
    'Pesanan tidak dapat diterima',
    '{mutawifName} tidak dapat menerima pesanan Anda. Silakan pilih mutawif lain.',
  ),
  'booking.started': define('Pendampingan dimulai', '{mutawifName} sudah memulai pendampingan Anda.'),
  'booking.completed': define(
    'Pendampingan selesai',
    'Pendampingan bersama {mutawifName} telah selesai. Beri penilaian untuk membantu jamaah lain.',
  ),
  'booking.cancelled': define('Pesanan dibatalkan', 'Pesanan {code} dibatalkan. Alasan: {reason}'),
  'booking.expired': define(
    'Pesanan kedaluwarsa',
    'Pesanan {code} kedaluwarsa karena tidak dikonfirmasi. Silakan pesan mutawif lain.',
  ),

  'mutawif.verification_approved': define(
    'Verifikasi disetujui',
    'Selamat, akun mutawif Anda telah terverifikasi. Anda sudah bisa menerima pesanan.',
  ),
  'mutawif.verification_rejected': define(
    'Verifikasi belum disetujui',
    'Verifikasi akun mutawif Anda belum disetujui. Catatan: {note}',
  ),
} satisfies Record<string, TemplateFn>;

export type NotificationTemplateKey = keyof typeof NotificationTemplates;

export function renderTemplate(
  key: NotificationTemplateKey,
  vars: Record<string, string> = {},
): NotificationTemplate {
  return NotificationTemplates[key](vars);
}
