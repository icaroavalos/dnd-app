import { resourceRecoveryFromBody } from '../dist/src/core/character/resource-engine.js';

// Test data
const tests = [
  {
    name: "Barbarian Rage (2024)",
    text: "You can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.",
    expected: { short: '1', long: 'all' }
  },
  {
    name: "Druid Wild Shape (2024)",
    text: "You can use Wild Shape twice. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.",
    expected: { short: '1', long: 'all' }
  },
  {
    name: "Fighter Second Wind",
    text: "You regain one expended use when you finish a {@variantrule Short Rest|XPHB}.",
    expected: { short: '1' }
  },
  {
    name: "Fighter Action Surge",
    text: "You can't use this feature again until you finish a Short Rest or Long Rest.",
    expected: { short: 'all', long: 'all' }
  },
  {
    name: "Channel Divinity",
    text: "You regain all expended uses when you finish a Short Rest.",
    expected: { short: 'all' }
  }
];

console.log("=== Recovery Pattern Tests ===\n");
let passCount = 0;

for (const test of tests) {
  const result = resourceRecoveryFromBody(test.text);
  const shortOk = result.short === test.expected.short || String(result.short) === String(test.expected.short);
  const longOk = result.long === test.expected.long || (result.long === test.expected.long) || (!test.expected.long && !result.long);
  const ok = shortOk && longOk;

  console.log(`${ok ? "✓" : "✗"} ${test.name}`);
  console.log(`  Expected: short=${test.expected.short}, long=${test.expected.long || 'N/A'}`);
  console.log(`  Got:      short=${result.short}, long=${result.long || 'N/A'}`);

  if (ok) passCount++;
  else console.log(`  STATUS: FAIL`);
  console.log("");
}

console.log(`\n=== Summary: ${passCount}/${tests.length} tests passed ===`);

if (passCount < tests.length) {
  process.exit(1);
}
