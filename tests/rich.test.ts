import { describe, expect, it } from 'vitest';
import { inline, plain } from '../src/components/ui/Rich';

describe('rich text', () => {
  it('parses nested bold/italic without looping (regression: shared regex state)', () => {
    const out = inline('Knoll Academy wants the **average amount** families spend. They survey **100 families**, and *all* of them answer.');
    expect(out.length).toBeGreaterThan(4);
  });

  it('keeps money amounts as text, not math', () => {
    const out = inline('Three spent $65, $75, and $95.');
    expect(out).toEqual(['Three spent $65, $75, and $95.']);
  });

  it('renders inline math and strips markup for plain text', () => {
    const out = inline('The mean $\\bar{x}$ is **sensitive** to outliers.');
    expect(out.length).toBe(5);
    expect(plain('The **mean** $\\bar{x}$')).toBe('The mean x');
  });
});
