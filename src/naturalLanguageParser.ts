import { db, type NaturalLanguageRule } from './db';

// Category keywords mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  development: ['dev', 'development', 'programming', 'code', 'coding', 'tech', 'software', 'github', 'stackoverflow'],
  shopping: ['shop', 'shopping', 'store', 'buy', 'purchase', 'amazon', 'ebay'],
  social: ['social', 'social media', 'facebook', 'twitter', 'instagram', 'reddit', 'linkedin'],
  news: ['news', 'newspaper', 'media', 'headlines'],
  entertainment: ['entertainment', 'video', 'music', 'games', 'gaming', 'movies', 'youtube', 'netflix', 'streaming'],
  work: ['work', 'office', 'job', 'business', 'professional', 'meeting', 'slack', 'teams'],
  research: ['research', 'academic', 'science', 'study', 'paper', 'journal'],
  finance: ['finance', 'financial', 'banking', 'money', 'investment', 'crypto', 'stocks'],
  health: ['health', 'medical', 'fitness', 'wellness', 'doctor'],
  education: ['education', 'learning', 'course', 'tutorial', 'school', 'university']
};

// Intent detection patterns
const EXCLUDE_PATTERNS = [
  /\b(don't|dont|do not|never|ignore|skip|exclude|block|no)\b/i,
  /\b(stop tracking|stop saving)\b/i
];

const INCLUDE_PATTERNS = [
  /\b(keep|save|always|include|track|want|love)\b/i,
  /\b(always save|always track)\b/i
];

// Domain extraction regex - matches common TLDs
const DOMAIN_REGEX = /\b([a-z0-9][-a-z0-9]*\.)+(?:com|org|net|io|co|dev|app|me|tv|edu|gov|uk|de|fr|jp|cn|au|ca|in)\b/gi;

// Exception pattern for "except" clauses
const EXCEPT_PATTERN = /\bexcept\s+(.+?)(?:\.|$)/i;

export interface ParsedRule {
  rawText: string;
  type: 'include' | 'exclude';
  conditions: {
    domains?: string[];
    keywords?: string[];
    categories?: string[];
  };
  exceptions?: {
    domains?: string[];
  };
  priority: number;
}

/**
 * Detect the intent (include/exclude) from a line of text
 */
function detectIntent(text: string): 'include' | 'exclude' {
  const hasExcludeIntent = EXCLUDE_PATTERNS.some(pattern => pattern.test(text));
  const hasIncludeIntent = INCLUDE_PATTERNS.some(pattern => pattern.test(text));

  // Exclude takes precedence if both are found (e.g., "don't keep")
  if (hasExcludeIntent) return 'exclude';
  if (hasIncludeIntent) return 'include';

  // Default to include if no clear intent
  return 'include';
}

/**
 * Extract domain names from text
 */
function extractDomains(text: string): string[] {
  const matches = text.match(DOMAIN_REGEX) || [];
  return [...new Set(matches.map(d => d.toLowerCase()))];
}

/**
 * Map keywords to categories
 */
function mapToCategories(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const categories: string[] = [];

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => normalizedText.includes(keyword))) {
      categories.push(category);
    }
  }

  return categories;
}

/**
 * Extract general keywords from text (not categories or domains)
 */
function extractKeywords(text: string): string[] {
  // Remove domains first
  let cleanText = text.replace(DOMAIN_REGEX, '');

  // Remove common intent words
  const intentWords = ['keep', 'save', 'always', 'include', 'track', 'want', 'love',
    'don\'t', 'dont', 'do', 'not', 'never', 'ignore', 'skip', 'exclude', 'block', 'no',
    'except', 'all', 'my', 'the', 'and', 'or', 'a', 'an', 'stuff', 'sites', 'things'];

  const words = cleanText.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !intentWords.includes(word));

  // Filter out category keywords that were already matched
  const categoryKeywords = Object.values(CATEGORY_KEYWORDS).flat();
  return [...new Set(words.filter(word => !categoryKeywords.includes(word)))];
}

/**
 * Extract exceptions from text (e.g., "except amazon.com")
 */
function extractExceptions(text: string): { domains?: string[] } | undefined {
  const exceptMatch = text.match(EXCEPT_PATTERN);
  if (!exceptMatch) return undefined;

  const exceptText = exceptMatch[1];
  const domains = extractDomains(exceptText);

  if (domains.length === 0) return undefined;
  return { domains };
}

/**
 * Parse a single line of natural language preference
 */
function parseLine(text: string, lineIndex: number): ParsedRule | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('#')) return null; // Empty or comment

  const type = detectIntent(trimmed);
  const domains = extractDomains(trimmed);
  const categories = mapToCategories(trimmed);
  const keywords = extractKeywords(trimmed);
  const exceptions = extractExceptions(trimmed);

  // Must have at least one condition
  if (domains.length === 0 && categories.length === 0 && keywords.length === 0) {
    return null;
  }

  // Remove exception domains from the main conditions
  let conditionDomains = domains;
  if (exceptions?.domains) {
    conditionDomains = domains.filter(d => !exceptions.domains!.includes(d));
  }

  const rule: ParsedRule = {
    rawText: trimmed,
    type,
    conditions: {},
    priority: lineIndex + 1 // Earlier rules have lower priority (processed first)
  };

  if (conditionDomains.length > 0) rule.conditions.domains = conditionDomains;
  if (categories.length > 0) rule.conditions.categories = categories;
  if (keywords.length > 0) rule.conditions.keywords = keywords;
  if (exceptions) rule.exceptions = exceptions;

  return rule;
}

/**
 * Parse multiline natural language preferences into structured rules
 */
export function parsePreferences(text: string): ParsedRule[] {
  const lines = text.split('\n');
  const rules: ParsedRule[] = [];

  lines.forEach((line, index) => {
    const rule = parseLine(line, index);
    if (rule) {
      rules.push(rule);
    }
  });

  return rules;
}

/**
 * Check if a URL/title matches a specific rule
 */
export function matchesRule(url: string, title: string, rule: ParsedRule): boolean {
  const domain = extractDomainFromUrl(url);
  const normalizedUrl = url.toLowerCase();
  const normalizedTitle = title.toLowerCase();

  // Check for exceptions first
  if (rule.exceptions?.domains) {
    if (rule.exceptions.domains.some(d => domain.includes(d))) {
      return false; // Exception matched, rule doesn't apply
    }
  }

  // Check domain conditions
  if (rule.conditions.domains?.length) {
    if (rule.conditions.domains.some(d => domain.includes(d))) {
      return true;
    }
  }

  // Check category conditions (via category keywords in URL/title)
  if (rule.conditions.categories?.length) {
    for (const category of rule.conditions.categories) {
      const categoryKeywords = CATEGORY_KEYWORDS[category] || [];
      if (categoryKeywords.some(kw => normalizedUrl.includes(kw) || normalizedTitle.includes(kw))) {
        return true;
      }
    }
  }

  // Check keyword conditions
  if (rule.conditions.keywords?.length) {
    if (rule.conditions.keywords.some(kw =>
      normalizedUrl.includes(kw) || normalizedTitle.includes(kw)
    )) {
      return true;
    }
  }

  return false;
}

/**
 * Check if URL should be excluded based on all active rules
 * Returns true if URL should be excluded
 */
export async function shouldExcludeUrl(url: string, title: string): Promise<boolean> {
  const rules = await db.naturalLanguageRules
    .where('isActive')
    .equals(1) // Dexie converts boolean to 1/0
    .toArray();

  // Sort by priority (lower = higher priority)
  rules.sort((a, b) => a.priority - b.priority);

  for (const rule of rules) {
    if (matchesRule(url, title, {
      rawText: rule.rawText,
      type: rule.type,
      conditions: rule.conditions,
      priority: rule.priority
    })) {
      return rule.type === 'exclude';
    }
  }

  return false; // Default: don't exclude
}

/**
 * Check if URL should be included based on all active rules
 * Returns true if URL should be force-included (overriding other exclusions)
 */
export async function shouldIncludeUrl(url: string, title: string): Promise<boolean> {
  const rules = await db.naturalLanguageRules
    .where('isActive')
    .equals(1)
    .toArray();

  // Sort by priority
  rules.sort((a, b) => a.priority - b.priority);

  for (const rule of rules) {
    if (rule.type === 'include' && matchesRule(url, title, {
      rawText: rule.rawText,
      type: rule.type,
      conditions: rule.conditions,
      priority: rule.priority
    })) {
      return true;
    }
  }

  return false;
}

/**
 * Save parsed rules to database
 */
export async function saveRulesToDatabase(rules: ParsedRule[]): Promise<void> {
  // Clear existing rules
  await db.naturalLanguageRules.clear();

  // Add new rules
  const dbRules: Omit<NaturalLanguageRule, 'id'>[] = rules.map(rule => ({
    rawText: rule.rawText,
    type: rule.type,
    conditions: rule.conditions,
    priority: rule.priority,
    isActive: true
  }));

  await db.naturalLanguageRules.bulkAdd(dbRules);
}

/**
 * Get interpreted rules as human-readable strings
 */
export function formatRulesForDisplay(rules: ParsedRule[]): string[] {
  return rules.map(rule => {
    const icon = rule.type === 'include' ? '✓' : '✗';
    const parts: string[] = [];

    if (rule.conditions.categories?.length) {
      parts.push(`${rule.conditions.categories.join(', ')} category`);
    }
    if (rule.conditions.domains?.length) {
      parts.push(rule.conditions.domains.join(', '));
    }
    if (rule.conditions.keywords?.length) {
      parts.push(`keywords: ${rule.conditions.keywords.join(', ')}`);
    }

    let result = `${icon} ${rule.type}: ${parts.join(', ')}`;

    if (rule.exceptions?.domains?.length) {
      result += ` (except ${rule.exceptions.domains.join(', ')})`;
    }

    return result;
  });
}

/**
 * Extract domain from a full URL
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Get category from natural language rules for a URL
 */
export function getCategoryFromRules(url: string, title: string, rules: ParsedRule[]): string | undefined {
  for (const rule of rules) {
    if (rule.type === 'include' && rule.conditions.categories?.length) {
      if (matchesRule(url, title, rule)) {
        return rule.conditions.categories[0];
      }
    }
  }
  return undefined;
}
