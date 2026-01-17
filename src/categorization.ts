import type { Bookmark } from './db';

export interface CategorizationRule {
  category: string;
  patterns: {
    domain?: string[];
    urlKeywords?: string[];
    titleKeywords?: string[];
  };
  confidence: number;
}

// Rule-based categorization patterns
const rules: CategorizationRule[] = [
  // Development
  {
    category: 'development',
    patterns: {
      domain: ['github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com', 'stackexchange.com'],
      urlKeywords: ['code', 'dev', 'api', 'docs', 'documentation'],
      titleKeywords: ['programming', 'code', 'developer', 'api', 'tutorial', 'documentation']
    },
    confidence: 0.9
  },
  // Shopping
  {
    category: 'shopping',
    patterns: {
      domain: ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'etsy.com', 'aliexpress.com', 'alibaba.com'],
      urlKeywords: ['shop', 'store', 'cart', 'product', 'buy'],
      titleKeywords: ['buy', 'shop', 'store', 'price', 'deal', 'sale']
    },
    confidence: 0.95
  },
  // Social Media
  {
    category: 'social',
    patterns: {
      domain: ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'snapchat.com'],
      urlKeywords: ['social', 'profile', 'post', 'feed'],
      titleKeywords: ['social', 'share', 'follow', 'friend']
    },
    confidence: 0.95
  },
  // News
  {
    category: 'news',
    patterns: {
      domain: ['cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'reuters.com', 'apnews.com'],
      urlKeywords: ['news', 'article', 'breaking', 'latest'],
      titleKeywords: ['news', 'breaking', 'report', 'latest', 'update']
    },
    confidence: 0.9
  },
  // Entertainment
  {
    category: 'entertainment',
    patterns: {
      domain: ['youtube.com', 'netflix.com', 'hulu.com', 'spotify.com', 'twitch.tv', 'imdb.com'],
      urlKeywords: ['watch', 'video', 'movie', 'music', 'stream', 'play'],
      titleKeywords: ['watch', 'video', 'movie', 'music', 'stream', 'episode']
    },
    confidence: 0.9
  },
  // Work
  {
    category: 'work',
    patterns: {
      domain: ['slack.com', 'zoom.us', 'teams.microsoft.com', 'notion.so', 'trello.com', 'asana.com', 'jira.atlassian.com'],
      urlKeywords: ['workspace', 'meeting', 'project', 'task', 'team'],
      titleKeywords: ['meeting', 'project', 'task', 'team', 'workspace', 'collaboration']
    },
    confidence: 0.9
  },
  // Research
  {
    category: 'research',
    patterns: {
      domain: ['scholar.google.com', 'arxiv.org', 'researchgate.net', 'pubmed.ncbi.nlm.nih.gov', 'jstor.org'],
      urlKeywords: ['research', 'paper', 'study', 'journal', 'article'],
      titleKeywords: ['research', 'study', 'paper', 'journal', 'academic']
    },
    confidence: 0.9
  },
  // Finance
  {
    category: 'finance',
    patterns: {
      domain: ['paypal.com', 'stripe.com', 'coinbase.com', 'robinhood.com', 'etrade.com', 'mint.com'],
      urlKeywords: ['bank', 'payment', 'finance', 'invest', 'stock', 'crypto'],
      titleKeywords: ['bank', 'payment', 'finance', 'invest', 'stock', 'crypto', 'trading']
    },
    confidence: 0.85
  },
  // Health
  {
    category: 'health',
    patterns: {
      domain: ['webmd.com', 'healthline.com', 'mayoclinic.org', 'nih.gov', 'cdc.gov'],
      urlKeywords: ['health', 'medical', 'doctor', 'medicine', 'symptom'],
      titleKeywords: ['health', 'medical', 'doctor', 'medicine', 'symptom', 'disease']
    },
    confidence: 0.85
  },
  // Education
  {
    category: 'education',
    patterns: {
      domain: ['coursera.org', 'udemy.com', 'khanacademy.org', 'edx.org', 'skillshare.com', 'linkedin.com/learning'],
      urlKeywords: ['course', 'learn', 'education', 'tutorial', 'lesson'],
      titleKeywords: ['course', 'learn', 'education', 'tutorial', 'lesson', 'training']
    },
    confidence: 0.9
  }
];

export interface CategorizationResult {
  category: string;
  confidence: number;
  method: 'rule' | 'ai' | 'manual';
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if text contains any of the keywords
 */
function containsKeywords(text: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return false;
  const normalized = normalizeText(text);
  return keywords.some(keyword => normalized.includes(normalizeText(keyword)));
}

/**
 * Categorize a bookmark using rule-based approach
 */
export function categorizeBookmark(bookmark: Bookmark): CategorizationResult {
  const domain = extractDomain(bookmark.url);
  const url = normalizeText(bookmark.url);
  const title = normalizeText(bookmark.title);

  let bestMatch: CategorizationResult = {
    category: 'uncategorized',
    confidence: 0,
    method: 'rule'
  };

  for (const rule of rules) {
    let score = 0;
    let matches = 0;

    // Check domain match (highest weight)
    if (rule.patterns.domain?.some(d => domain.includes(d))) {
      score += 0.6;
      matches++;
    }

    // Check URL keywords
    if (containsKeywords(url, rule.patterns.urlKeywords)) {
      score += 0.2;
      matches++;
    }

    // Check title keywords
    if (containsKeywords(title, rule.patterns.titleKeywords)) {
      score += 0.2;
      matches++;
    }

    // Calculate final confidence
    const confidence = matches > 0 ? (score * rule.confidence) : 0;

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category: rule.category,
        confidence,
        method: 'rule'
      };
    }
  }

  return bestMatch;
}

/**
 * Batch categorize multiple bookmarks
 */
export function batchCategorize(bookmarks: Bookmark[]): Map<string, CategorizationResult> {
  const results = new Map<string, CategorizationResult>();

  for (const bookmark of bookmarks) {
    if (!bookmark.category || bookmark.category === 'uncategorized') {
      const result = categorizeBookmark(bookmark);
      // Only apply if confidence is high enough
      if (result.confidence >= 0.5) {
        results.set(bookmark.id, result);
      }
    }
  }

  return results;
}

/**
 * Normalize URL for duplicate detection
 * Removes tracking parameters, normalizes www/trailing slashes, sorts query params
 *
 * Normalization rules:
 * 1. Remove tracking parameters (utm_*, fbclid, gclid, etc.)
 * 2. Remove www. prefix from hostname
 * 3. Remove trailing slashes from pathname
 * 4. Sort remaining query parameters for consistency
 * 5. Remove hash fragments (unless it's a SPA route starting with #/)
 * 6. Convert to lowercase hostname
 *
 * @example
 * normalizeURL('https://www.example.com/page/?utm_source=google&id=123')
 * // Returns: 'https://example.com/page?id=123'
 */
export function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);

    // Tracking parameters to remove
    const trackingParams = [
      // Google Analytics
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      '_ga', '_gid', '_gac', '_gl',
      // Facebook
      'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',
      // Google Ads
      'gclid', 'gclsrc', 'dclid',
      // Microsoft/Bing
      'msclkid', 'mkt_tok',
      // Other common tracking
      'mc_cid', 'mc_eid', // Mailchimp
      'ref', 'source', 'campaign',
      '_hsenc', '_hsmi', // HubSpot
      'affiliate_id', 'aff_id'
    ];

    // Remove tracking parameters
    trackingParams.forEach(param => urlObj.searchParams.delete(param));

    // Normalize hostname: remove www, convert to lowercase
    urlObj.hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();

    // Remove trailing slash from pathname
    urlObj.pathname = urlObj.pathname.replace(/\/$/, '') || '/';

    // Sort remaining query params for consistency
    const sortedParams = new URLSearchParams(
      Array.from(urlObj.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b))
    );
    urlObj.search = sortedParams.toString();

    // Remove hash fragment unless it's a SPA route
    if (urlObj.hash && !urlObj.hash.startsWith('#/')) {
      urlObj.hash = '';
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Generate content hash for duplicate detection
 * Uses normalized URL to ensure duplicates are detected even with tracking params
 */
export function generateContentHash(url: string): string {
  const normalized = normalizeURL(url);
  return btoa(normalized);
}

/**
 * Detect duplicate bookmarks
 */
export function findDuplicates(bookmarks: Bookmark[]): Map<string, string[]> {
  const hashMap = new Map<string, string[]>();

  for (const bookmark of bookmarks) {
    const hash = bookmark.metadata.contentHash;
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash)!.push(bookmark.id);
  }

  // Filter to only duplicates (more than 1)
  const duplicates = new Map<string, string[]>();
  for (const [hash, ids] of hashMap.entries()) {
    if (ids.length > 1) {
      duplicates.set(hash, ids);
    }
  }

  return duplicates;
}
