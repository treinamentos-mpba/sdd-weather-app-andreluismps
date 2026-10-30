import { describe, expect, it } from 'vitest';
import { isStaleReference } from '../../src/lib/freshness';

describe('isStaleReference', () => {
  it.each([
    ['2026-10-29T14:59:59Z', false],
    ['2026-10-29T15:00:00Z', false],
    ['2026-10-29T15:00:01Z', true],
  ])('treats only data older than two hours as stale at %s', (now, expected) => {
    // 10:00 em America/Sao_Paulo (UTC-3) = 13:00Z
    expect(isStaleReference('2026-10-29T10:00', 'America/Sao_Paulo', new Date(now))).toBe(expected);
  });

  it('interprets the reference time in the city timezone, not the host timezone', () => {
    // 10:00 em Europe/Berlin (UTC+1 em outubro) = 09:00Z
    expect(
      isStaleReference('2026-10-29T10:00', 'Europe/Berlin', new Date('2026-10-29T11:00:00Z')),
    ).toBe(false);
    expect(
      isStaleReference('2026-10-29T10:00', 'Europe/Berlin', new Date('2026-10-29T11:01:00Z')),
    ).toBe(true);
  });

  it('measures real elapsed time across a daylight-saving change', () => {
    // 01:30 em Berlim (UTC+1) = 00:30Z; às 02:00Z o relógio local pula para 03:00.
    expect(
      isStaleReference('2026-03-29T01:30', 'Europe/Berlin', new Date('2026-03-29T02:30:00Z')),
    ).toBe(false);
    expect(
      isStaleReference('2026-03-29T01:30', 'Europe/Berlin', new Date('2026-03-29T02:31:00Z')),
    ).toBe(true);
  });

  it.each([
    undefined,
    '',
    'invalid',
    '2026-10-29',
  ])('is not stale when the reference time is unusable (%s)', (referenceTime) => {
    expect(
      isStaleReference(referenceTime, 'America/Sao_Paulo', new Date('2030-01-01T00:00:00Z')),
    ).toBe(false);
  });

  it('does not throw for an invalid timezone', () => {
    expect(
      isStaleReference('2026-10-29T10:00', 'not-a-timezone', new Date('2030-01-01T00:00:00Z')),
    ).toBe(false);
  });
});
