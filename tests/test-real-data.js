const fs = require('fs');
const appjs = fs.readFileSync('./app.js', 'utf-8');
const jsonData = JSON.parse(fs.readFileSync('./data/5etools/5e-2024/class-features.json', 'utf-8'));

// Extract function
eval(appjs.match(/function resourceRecoveryFromBody\(body\) \{[\s\S]*?return recovery;/)[0] + "}");

console.log("=== Test with Real 5etools Data ===\n");

// Test Rage
const rageFeature = jsonData.results.find(f => f.name === 'Rage' && f.className === 'Barbarian');
if (rageFeature) {
    const rageText = rageFeature.entries.join(' ');
    const recovery = resourceRecoveryFromBody(rageText);
    console.log("Barbarian Rage:");
    console.log("  Text:", rageText.substring(0, 150) + "...");
    console.log("  Recovery: short=", recovery.short, ", long=", recovery.long);
    console.log("  Expected: short=1, long=all");
    console.log("  ", recovery.short === '1' && recovery.short === 1 && recovery.long === 'all' ? "PASS" : "FAIL");
}
console.log("");

// Test Action Surge
const actionSurge = jsonData.results.find(f => f.name === 'Action Surge' && f.className === 'Fighter');
if (actionSurge) {
    const text = actionSurge.entries.join(' ');
    const recovery = resourceRecoveryFromBody(text);
    console.log("Fighter Action Surge:");
    console.log("  Text:", text.substring(0, 150) + "...");
    console.log("  Recovery: short=", recovery.short, ", long=", recovery.long);
    console.log("  Expected: short=all, long=all");
    console.log("  ", (recovery.short === 'all' || recovery.short === '1') && recovery.long === 'all' ? "PASS" : "NEEDS CHECK");
}
