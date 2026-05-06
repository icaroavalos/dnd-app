/**
 * Background Parser - Parse raw 5etools background data into structured format
 */
function parseAbilityChoices(raw) {
    if (!raw || !Array.isArray(raw))
        return [];
    return raw.map((ability) => {
        if (!ability.choose) {
            return { options: [], type: 'choose' };
        }
        const choose = ability.choose;
        if (choose.weighted) {
            return {
                options: choose.weighted.from,
                weights: choose.weighted.weights,
                type: 'weighted',
            };
        }
        return {
            options: (choose.from || []),
            type: 'choose',
        };
    });
}
function parseSkillProficiencies(raw) {
    if (!raw)
        return [];
    return raw.flatMap((group) => {
        if (typeof group === 'object' && group !== null) {
            return Object.keys(group).filter((key) => group[key] === true);
        }
        return [];
    });
}
function parseToolProficiencies(raw) {
    if (!raw)
        return [];
    return raw.flatMap((group) => {
        if (typeof group === 'object' && group !== null) {
            return Object.keys(group).filter((key) => group[key] === true);
        }
        return [];
    });
}
function parseLanguages(raw) {
    if (!raw)
        return 0;
    const anyStandard = raw.find((lang) => typeof lang === 'object' && lang !== null && 'anyStandard' in lang);
    if (anyStandard && typeof anyStandard === 'object' && 'anyStandard' in anyStandard) {
        return anyStandard.anyStandard;
    }
    return raw.filter((lang) => typeof lang === 'string');
}
function parseEquipmentItem(entry) {
    if (typeof entry === 'string') {
        // Handle pipe notation like "book|phb"
        const [name] = entry.split('|');
        return { name: name.trim() };
    }
    if (typeof entry === 'object' && entry !== null) {
        return {
            name: entry.item || entry.special || '',
            displayName: entry.displayName,
            quantity: entry.quantity,
            special: entry.special,
        };
    }
    return null;
}
function parseEquipmentOption(entries) {
    const items = [];
    let goldValue;
    for (const entry of entries) {
        if (typeof entry === 'string')
            continue; // Skip empty strings
        if (typeof entry === 'object' && entry !== null && 'value' in entry) {
            goldValue = entry.value;
        }
        else {
            const item = parseEquipmentItem(entry);
            if (item && item.name)
                items.push(item);
        }
    }
    // Determine type based on content
    if (items.length > 0 && goldValue !== undefined) {
        return { type: 'mixed', items, goldValue };
    }
    if (goldValue !== undefined) {
        return { type: 'gold', goldValue };
    }
    return { type: 'items', items };
}
function parseEquipment(raw) {
    if (!raw || !Array.isArray(raw)) {
        return { optionA: { type: 'items', items: [] }, optionB: { type: 'items', items: [] } };
    }
    let optionAEntries = [];
    let optionBEntries = [];
    for (const group of raw) {
        if ('A' in group)
            optionAEntries = group.A;
        if ('B' in group)
            optionBEntries = group.B;
    }
    return {
        optionA: parseEquipmentOption(optionAEntries),
        optionB: parseEquipmentOption(optionBEntries),
    };
}
function parseMagicInitiateFeat(raw) {
    if (!raw || !Array.isArray(raw))
        return null;
    for (const group of raw) {
        for (const key of Object.keys(group)) {
            const normalizedKey = key.toLowerCase();
            if (normalizedKey.includes('magic initiate')) {
                // Extract class from patterns like "magic initiate; cleric|xphb"
                const match = key.match(/magic initiate;?\s*(\w+)/i);
                if (match) {
                    const sourceMatch = key.match(/\|(\w+)$/i);
                    return {
                        className: match[1],
                        source: sourceMatch ? sourceMatch[1].toUpperCase() : 'XPHB',
                    };
                }
            }
        }
    }
    return null;
}
/**
 * Parse a raw 5etools background into a structured ParsedBackground.
 */
export function parseBackground(raw) {
    return {
        name: raw.name,
        source: raw.source,
        page: raw.page,
        abilityScores: parseAbilityChoices(raw.ability),
        skillProficiencies: parseSkillProficiencies(raw.skillProficiencies),
        toolProficiencies: parseToolProficiencies(raw.toolProficiencies),
        languages: parseLanguages(raw.languageProficiencies),
        equipment: parseEquipment(raw.startingEquipment),
        feat: raw.feats ? raw.feats.flatMap((g) => Object.keys(g)).join(', ') : null,
        magicInitiate: parseMagicInitiateFeat(raw.feats),
    };
}
/**
 * Parse all backgrounds from raw data.
 */
export function parseAllBackgrounds(rawData) {
    return rawData.map(parseBackground);
}
//# sourceMappingURL=background-parser.js.map