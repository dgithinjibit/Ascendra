import { describe, expect, it } from 'vitest';
import { getHardcodedStrands } from './index';

describe('CBC curriculum registry', () => {
  it('resolves Grade 5 Kiswahili from the canonical local adapter', () => {
    const strands = getHardcodedStrands('Grade 5', 'Kiswahili');
    expect(strands).not.toBeNull();
    expect(strands).toHaveLength(4);
    expect(strands?.every((strand) => strand.subStrands.length > 0)).toBe(true);
  });

  it('accepts the persisted compact Grade5 value used by the wizard', () => {
    expect(getHardcodedStrands('Grade5', 'Kiswahili')).not.toBeNull();
  });
});
