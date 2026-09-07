import { describe, expect, it } from 'vitest';
import { renderTemplate } from './templates';

describe('renderTemplate', () => {
  it('interpolates variables', () => {
    const result = renderTemplate('auth.otp', { code: '123456', minutes: '5' });
    expect(result.body).toContain('123456');
    expect(result.body).toContain('5 menit');
  });

  it('leaves unknown placeholders visible instead of printing undefined', () => {
    const result = renderTemplate('booking.cancelled', { code: 'MSK-ABC123' });
    expect(result.body).toContain('MSK-ABC123');
    expect(result.body).toContain('{reason}');
    expect(result.body).not.toContain('undefined');
  });
});
