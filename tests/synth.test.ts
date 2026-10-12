import { describe, expect, it } from 'vitest';
import { auditSynth, median } from '../scripts/audit-synth';

/**
 * Guards the realism of the synthetic population (and the quiz's ability to
 * measure it). Bands are only as good as these numbers: in testing, making
 * synthetic answers too random skewed 36% of realistic pairs into
 * "Opposites attract?" instead of 20%.
 */
describe('synthetic population realism', () => {
  const a = auditSynth(600, 11);

  it('quiz recovers true traits reasonably (median validity ≥ 0.65, none < 0.5)', () => {
    expect(median(Object.values(a.validity))).toBeGreaterThanOrEqual(0.65);
    for (const [d, r] of Object.entries(a.validity)) expect(r, d).toBeGreaterThanOrEqual(0.5);
  });

  it('retake consistency looks like a short real quiz (median 0.55–0.8)', () => {
    const m = median(Object.values(a.reliability));
    expect(m).toBeGreaterThanOrEqual(0.55);
    expect(m).toBeLessThanOrEqual(0.8);
  });

  it('does not flag most people as inconsistent', () => {
    expect(a.inconsistentShare).toBeLessThan(0.5);
  });
});
