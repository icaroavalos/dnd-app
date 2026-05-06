// Test for Rage Short Rest Recovery
const fs = require('fs');

// Read app.js
const appjs = fs.readFileSync('./app.js', 'utf-8');

// Extract resourceRecoveryFromBody function
const recoveryMatch = appjs.match(/function resourceRecoveryFromBody\(body\) \{[\s\S]*?return recovery;/);
if (!recoveryMatch) {
    console.error("Could not find resourceRecoveryFromBody function");
    process.exit(1);
}

// Create executable function
const recoveryFunc = recoveryMatch[0].replace('\nreturn recovery;', '\nreturn recovery; }') + '}';

// Extract recoverShortRestResources
const shortRestMatch = appjs.match(/function recoverShortRestResources\(\) \{[\s\S]*?\}\n/);
let shortRestFunc = '';
if (shortRestMatch) {
    shortRestFunc = shortRestMatch[0];
}

eval(recoveryFunc);

// Test data - exact format from 5etools JSON
const rageText2024 = "You can enter your Rage the number of times shown for your Barbarian level in the Rages column of the Barbarian Features table. You regain one expended use when you finish a {@variantrule Short Rest|XPHB}, and you regain all expended uses when you finish a {@variantrule Long Rest|XPHB}.";

console.log("=== Testing Rage Recovery Detection ===");
console.log("Input text:", rageText2024.substring(0, 150) + "...");

const recovery = resourceRecoveryFromBody(rageText2024);

console.log("\n=== Results ===");
console.log("recovery.short:", recovery.short, "| Expected: '1' or 1");
console.log("recovery.long:", recovery.long, "| Expected: 'all'");

if (recovery.short === '1' || recovery.short === 1) {
    console.log("\n✓ PASS: Short rest recovery is correctly set to 1");
} else if (recovery.short === 'all') {
    console.log("\n✗ FAIL: Short rest recovery is 'all' - THIS IS THE BUG!");
} else {
    console.log("\n? UNKNOWN: recovery.short =", recovery.short);
}

// Simulate Short Rest recovery
console.log("\n=== Simulating Short Rest Effect ===");
let rageResource = {
    name: "Rage",
    max: 4,
    used: 4,  // All uses spent
    recovery: { short: recovery.short, long: recovery.long }
};

console.log("Before Short Rest: used", rageResource.used + "/" + rageResource.max);

// Apply short rest recovery logic (from line 3579-3591)
let resourceId = "rage";
let resource = rageResource;
let rec = resource.recovery?.short;

if (rec) {
    if (resourceId === "secondWind") {
        resource.used = Math.max(0, resource.used - 1);
    } else if (rec === "all") {
        resource.used = 0;
    } else {
        resource.used = Math.max(0, resource.used - Number(rec || 0));
    }
}

console.log("After Short Rest:  used", resource.used + "/" + resource.max);

if (resource.used === 3) {
    console.log("✓ PASS: Recovered 1 use (correct behavior)");
} else if (resource.used === 0) {
    console.log("✗ FAIL: Recovered ALL uses (BUG - should only recover 1)");
} else {
    console.log("? UNKNOWN: Used =", resource.used);
}
