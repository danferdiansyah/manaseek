import { describe, expect, it } from 'vitest';
import { renderTemplate } from './templates';

describe('renderTemplate', () => {
  it('interpolates variables', () => {
    const result = renderTemplate('booking.accepted', {
      mutawifName: 'Ustadz Hasan',
      schedule: '12 Nov 2026 08.00',
      meetingPoint: 'Gate King Abdul Aziz',
    });
    expect(result.body).toContain('Ustadz Hasan');
    expect(result.body).toContain('Gate King Abdul Aziz');
  });

  it('leaves unknown placeholders visible instead of printing undefined', () => {
    const result = renderTemplate('booking.cancelled', { code: 'MSK-ABC123' });
    expect(result.body).toContain('MSK-ABC123');
    expect(result.body).toContain('{reason}');
    expect(result.body).not.toContain('undefined');
  });
});
