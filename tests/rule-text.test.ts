import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getRuleTextParts } from '../frontend/src/components/ui/RuleText.tsx';

describe('RuleText', () => {
  it('parses raw 5etools variant rule tags into rule-link parts', () => {
    const parts = getRuleTextParts(
      'The object sheds {@variantrule Bright Light|XPHB} and {@variantrule Dim Light|XPHB}.'
    );

    assert.equal(parts.some((part) => part.type === 'text' && part.text.includes('{@variantrule')), false);
    assert.deepEqual(
      parts.filter((part) => part.type === 'link').map((part) => ({
        type: part.ruleType,
        name: part.name,
        source: part.source,
      })),
      [
        { type: 'variantrule', name: 'Bright Light', source: 'XPHB' },
        { type: 'variantrule', name: 'Dim Light', source: 'XPHB' },
      ]
    );
  });
});
