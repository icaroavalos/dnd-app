# Subclass Features Auto-Load Implementation Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Implement automatic loading of subclass features based on character level in the D&D 5e character builder app.

**Architecture:** 
1. Add `currentSubclassFeatureItems()` function that reads from `state.api.source.subclasses` 
2. Parse the `subclassFeatures` array (format: `"Name|Class|Source|Subclass|SubclassSource|Level"`)
3. Filter by current subclass choice and character level
4. Merge with `currentClassFeatureItems()` in the features list
5. Fetch full feature details from `classFeatures.json` by name matching

**Tech Stack:** Vanilla JavaScript, 5etools data format, existing app state management

---

### Task 1: Create `currentSubclassFeatureItems()` function

**Files:**
- Modify: `app.js:2624-2650` (after `currentClassFeatureItems()`)

**Steps:**

- [ ] **Step 1: Add new function**

Add this function after `currentClassFeatureData()`:

```javascript
function currentSubclassFeatureItems() {
  // Get current subclass slug (e.g., "path-of-the-berserker")
  const subclassSlug = state.character.classFeatureChoices?.subclass || "";
  if (!subclassSlug) return [];

  // Find subclass in API data
  const subclassData = (state.api.source?.subclasses || []).find(
    (sc) => slugifyName(sc.name) === subclassSlug && 
            slugifyName(sc.className) === state.character.class
  );

  if (!subclassData?.subclassFeatures) return [];

  const className = state.api.classes[state.character.class]?.name ?? titleCase(state.character.class);
  const characterLevel = state.character.level;

  // Parse and filter features by level
  return subclassData.subclassFeatures
    .map((featureStr) => {
      // Format: "Name|Class|Source|Subclass|SubclassSource|Level"
      const [name, className, source, subclassName, subclassSource, levelStr] = featureStr.split("|");
      const level = Number(levelStr);
      
      if (level > characterLevel) return null;

      // Find full feature details in classFeatures
      const fullFeature = (state.api.source?.classFeatures || []).find(
        (f) => f.name === name && f.className === className
      );

      return {
        id: `subclass:${slugifyName(name)}:${level}`,
        kind: "class",
        name: name,
        meta: `${className} ${level} • ${source} (Subclasse)`,
        body: fullFeature ? fullFeature.body : "Detalhe da subclasse.",
        level: level,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.level - b.level);
}
```

- [ ] **Step 2: Verify syntax**

Run: Open app in browser and check console for errors
Expected: No syntax errors

---

### Task 2: Integrate subclass features into `currentFeatureItems()`

**Files:**
- Modify: `app.js:2624-2630` (in `currentFeatureItems()`)

**Steps:**

- [ ] **Step 1: Update function to include subclass features**

Change from:
```javascript
function currentFeatureItems() {
  return [
    ...currentClassFeatureItems(),
    ...currentSpeciesTraitItems(),
    ...currentFeatItems(),
  ];
}
```

To:
```javascript
function currentFeatureItems() {
  return [
    ...currentClassFeatureItems(),
    ...currentSubclassFeatureItems(), // NOVO
    ...currentSpeciesTraitItems(),
    ...currentFeatItems(),
  ];
}
```

- [ ] **Step 2: Verify features appear**

Run: Open app, select Barbarian → Path of the Berserker, set level to 6
Expected: "Mindless Rage" appears in features list

---

### Task 3: Add verification test for Berserker features

**Files:**
- Create: `tests/subclass-features-test.js`
- Modify: `app.js` (add test helper function)

**Steps:**

- [ ] **Step 1: Add test data validation**

Add to end of `app.js`:
```javascript
// Test helper: verify Berserker features match expected levels
function verifyBerserkerFeatures() {
  const expected = [
    { level: 3, name: "Path of the Berserker" },
    { level: 6, name: "Mindless Rage" },
    { level: 10, name: "Retaliation" },
    { level: 14, name: "Intimidating Presence" },
  ];

  const subclassData = (state.api.source?.subclasses || []).find(
    (sc) => sc.name === "Path of the Berserker"
  );

  if (!subclassData?.subclassFeatures) {
    console.error("❌ Berserker subclass not found or has no features");
    return false;
  }

  const parsed = subclassData.subclassFeatures.map((str) => {
    const [name, , , , , levelStr] = str.split("|");
    return { name, level: Number(levelStr) };
  });

  let allMatch = true;
  expected.forEach((exp) => {
    const found = parsed.find((p) => p.name === exp.name && p.level === exp.level);
    if (!found) {
      console.error(`❌ Expected ${exp.name} at level ${exp.level}`);
      allMatch = false;
    } else {
      console.log(`✓ ${exp.name} at level ${exp.level}`);
    }
  });

  return allMatch;
}

// Run on load in development
if (location.hostname === "localhost") {
  setTimeout(() => {
    console.log("=== Verifying Berserker Features ===");
    verifyBerserkerFeatures();
  }, 1000);
}
```

- [ ] **Step 2: Test in browser**

Run: Open `http://localhost:5173`, open DevTools console
Expected: Console shows all 4 Berserker features verified with ✓

---

### Task 4: Full Integration Test - Barbarian Level 1-20

**Files:**
- Test: Manual testing in browser

**Steps:**

- [ ] **Step 1: Create test character**

1. Open app in browser
2. Create new Barbarian character named "Test Berserker"
3. Choose "Path of the Berserker" at level 3
4. Set level to 20 (use console: `state.character.level = 20; persist(); render();`)

- [ ] **Step 2: Verify feature list**

Run: Navigate to Features tab
Expected features visible:

| Level | Feature | Kind |
|-------|---------|------|
| 1 | Rage | Class |
| 1 | Unarmored Defense | Class |
| 1 | Weapon Mastery | Class |
| 2 | Danger Sense | Class |
| 2 | Reckless Attack | Class |
| 3 | Barbarian Subclass | Class |
| 3 | Path of the Berserker | Subclass ✓ |
| 3 | Primal Knowledge | Class |
| 6 | Mindless Rage | Subclass ✓ |
| 10 | Retaliation | Subclass ✓ |
| 14 | Intimidating Presence | Subclass ✓ |

- [ ] **Step 3: Console verification**

Run in console:
```javascript
const features = currentSubclassFeatureItems();
console.table(features.map(f => ({ 
  Name: f.name, 
  Level: f.level,
  Meta: f.meta 
})));
```

Expected: All 4 subclass features listed with correct levels (3, 6, 10, 14)

---

## Verification Checklist

Before marking complete, verify:

- [ ] Barbarian Berserker at level 6 shows "Mindless Rage" ✅
- [ ] Barbarian Berserker at level 10 shows "Retaliation" ✅
- [ ] Barbarian Berserker at level 14 shows "Intimidating Presence" ✅
- [ ] Features sorted by level ✅
- [ ] Subclass choice at level 3 is required for features to appear ✅
- [ ] No subclass choice = no subclass features shown ✅

---

## Test Plan Summary

| Test | Description | Pass Criteria |
|------|-------------|---------------|
| T1 | Subclass features parsed correctly | `currentSubclassFeatureItems()` returns 4 features for Berserker level 20 |
| T2 | Level filtering works | Level 5 character only shows level 3 subclass feature |
| T3 | Level 10 Retaliation | Retaliation appears at level 10, not 14 |
| T4 | Level 14 Intimidating Presence | Intimidating Presence appears at level 14, not 10 |
| T5 | Integration | Features tab shows all subclass features mixed with class features |
