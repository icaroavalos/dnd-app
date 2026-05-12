/**
 * Utility functions to parse and clean 5etools data structures
 */

export const clean5eText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/{@(damage|dice|scaledamage|scaledice) ([^}|]+)(?:\|[^}]*)?}/g, '$2')
    .replace(/{@(spell|item|class|creature|feat|condition|filter|skill|sense|background) ([^}|]+)(?:\|[^}]*)?}/g, '$2')
    .replace(/{@variantrule ([^}|]+)(?:\|[^}]*)?}/g, '$1')
    .replace(/{@i ([^}]+)}/g, '$1')
    .replace(/{@b ([^}]+)}/g, '**$1**')
    .replace(/{@atk ([^}]+)}/g, '$1')
    .replace(/{@h}/g, 'Hit: ')
    .replace(/{@dc ([^}]+)}/g, 'DC $1')
    .replace(/{@note ([^}]+)}/g, '($1)')
    .replace(/{@(link|url) ([^}|]+)(?:\|[^}]*)?}/g, '$2')
    .replace(/{@book ([^}|]+)(?:\|[^}]*)?}/g, '$2');
};

export const parse5eEntry = (entry: any): string => {
  if (typeof entry === 'string') return clean5eText(entry);
  if (!entry) return '';

  if (Array.isArray(entry)) {
    return entry.map((e: any) => parse5eEntry(e)).join('\n\n');
  }

  if (entry.type === 'entries' && Array.isArray(entry.entries)) {
    const title = entry.name ? `**${entry.name}.** ` : '';
    return title + entry.entries.map((e: any) => parse5eEntry(e)).join('\n');
  }

  if (entry.type === 'list' && Array.isArray(entry.items)) {
    return entry.items.map((item: any) => `• ${parse5eEntry(item)}`).join('\n');
  }

  if (entry.type === 'item') {
    const title = entry.name ? `**${entry.name}.** ` : '';
    const content = entry.entry ? parse5eEntry(entry.entry) : (entry.entries ? parse5eEntry(entry.entries) : '');
    return title + content;
  }
  
  if (entry.entries) {
    const title = entry.name ? `**${entry.name}.** ` : '';
    return title + parse5eEntry(entry.entries);
  }

  return '';
};

/**
 * Recursively find an entry by name in a 5etools entries structure
 */
export const findEntryByName = (entries: any, name: string): any => {
  if (!entries) return null;
  
  if (Array.isArray(entries)) {
    for (const e of entries) {
      const found = findEntryByName(e, name);
      if (found) return found;
    }
    return null;
  }

  if (entries.name && entries.name.toLowerCase().includes(name.toLowerCase())) {
    return entries;
  }

  if (entries.entries) {
    return findEntryByName(entries.entries, name);
  }

  if (entries.items) {
    return findEntryByName(entries.items, name);
  }

  return null;
};
