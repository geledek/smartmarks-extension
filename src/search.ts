import Fuse, { type FuseResult } from 'fuse.js';
import { db, type Bookmark } from './db';

export interface SearchResult {
  bookmark: Bookmark;
  score: number;
  matches?: FuseResult<Bookmark>['matches'];
}

export interface SearchOptions {
  query: string;
  category?: string;
  includeArchived?: boolean;
  limit?: number;
}

export interface ConversationalQuery {
  contentHints: string[];
  temporalHints?: {
    type: 'relative' | 'absolute';
    value: string;
    startDate?: number;
    endDate?: number;
  };
  categoryHints: string[];
}

/**
 * Parse conversational query
 * Examples:
 * - "that flower website I saw last week"
 * - "github repo from yesterday"
 * - "shopping sites I visited this month"
 */
export function parseConversationalQuery(query: string): ConversationalQuery {
  const normalized = query.toLowerCase();
  const result: ConversationalQuery = {
    contentHints: [],
    categoryHints: []
  };

  // Extract temporal hints
  const temporalPatterns = [
    { pattern: /last\s+week/i, days: 7 },
    { pattern: /this\s+week/i, days: 7 },
    { pattern: /yesterday/i, days: 1 },
    { pattern: /today/i, days: 1 },
    { pattern: /last\s+month/i, days: 30 },
    { pattern: /this\s+month/i, days: 30 },
    { pattern: /last\s+(\d+)\s+days?/i, days: 0 }, // Extract number
  ];

  for (const { pattern, days } of temporalPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const actualDays = days === 0 && match[1] ? parseInt(match[1]) : days;
      const now = Date.now();
      result.temporalHints = {
        type: 'relative',
        value: match[0],
        startDate: now - (actualDays * 24 * 60 * 60 * 1000),
        endDate: now
      };
      break;
    }
  }

  // Extract category hints
  const categoryKeywords = [
    { keywords: ['dev', 'code', 'programming', 'github'], category: 'development' },
    { keywords: ['shop', 'buy', 'store', 'amazon'], category: 'shopping' },
    { keywords: ['social', 'facebook', 'twitter', 'instagram'], category: 'social' },
    { keywords: ['news', 'article'], category: 'news' },
    { keywords: ['video', 'watch', 'youtube', 'movie'], category: 'entertainment' },
    { keywords: ['work', 'meeting', 'slack'], category: 'work' },
    { keywords: ['research', 'paper', 'study'], category: 'research' },
    { keywords: ['bank', 'finance', 'invest'], category: 'finance' },
    { keywords: ['health', 'medical'], category: 'health' },
    { keywords: ['course', 'learn', 'education'], category: 'education' },
  ];

  for (const { keywords, category } of categoryKeywords) {
    if (keywords.some(kw => normalized.includes(kw))) {
      result.categoryHints.push(category);
    }
  }

  // Extract content hints (words that aren't temporal or category related)
  const stopWords = ['that', 'the', 'a', 'an', 'i', 'saw', 'visited', 'from', 'on', 'at', 'website', 'site', 'page'];
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => {
      if (stopWords.includes(word)) return false;
      if (result.temporalHints && result.temporalHints.value.includes(word)) return false;
      if (result.categoryHints.some(cat => cat.includes(word))) return false;
      return word.length > 2;
    });

  result.contentHints = words;

  return result;
}

/**
 * Fuzzy search bookmarks
 */
export async function searchBookmarks(options: SearchOptions): Promise<SearchResult[]> {
  let bookmarks = await db.bookmarks.toArray();

  // Filter by archived status
  if (!options.includeArchived) {
    bookmarks = bookmarks.filter(b => !b.isArchived);
  }

  // Filter by category
  if (options.category) {
    bookmarks = bookmarks.filter(b => b.category === options.category);
  }

  // Parse conversational query
  const parsed = parseConversationalQuery(options.query);

  // Filter by temporal hints
  if (parsed.temporalHints) {
    bookmarks = bookmarks.filter(b => {
      if (!b.lastVisited) return false;
      const { startDate, endDate } = parsed.temporalHints!;
      return b.lastVisited >= startDate! && b.lastVisited <= endDate!;
    });
  }

  // Filter by category hints
  if (parsed.categoryHints.length > 0) {
    bookmarks = bookmarks.filter(b =>
      b.category && parsed.categoryHints.includes(b.category)
    );
  }

  // Configure Fuse.js for fuzzy search
  const fuse = new Fuse(bookmarks, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'url', weight: 0.3 },
      { name: 'metadata.description', weight: 0.2 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
  });

  // Search with content hints
  const searchQuery = parsed.contentHints.length > 0
    ? parsed.contentHints.join(' ')
    : options.query;

  const fuseResults = fuse.search(searchQuery);

  // Convert to SearchResult with ranking
  const results: SearchResult[] = fuseResults.map(result => {
    const bookmark = result.item;
    let score = 1 - (result.score || 0); // Invert Fuse score (lower is better)

    // Boost score based on:
    // 1. Visit frequency (20%)
    const maxVisits = Math.max(...bookmarks.map(b => b.visitCount));
    const visitScore = maxVisits > 0 ? (bookmark.visitCount / maxVisits) : 0;
    score += visitScore * 0.2;

    // 2. Recency (30%)
    if (bookmark.lastVisited) {
      const now = Date.now();
      const daysSinceVisit = (now - bookmark.lastVisited) / (24 * 60 * 60 * 1000);
      const recencyScore = Math.max(0, 1 - (daysSinceVisit / 90)); // Decay over 90 days
      score += recencyScore * 0.3;
    }

    // 3. Pinned bookmarks get boost
    if (bookmark.isPinned) {
      score += 0.1;
    }

    return {
      bookmark,
      score: Math.min(score, 1), // Cap at 1.0
      matches: result.matches
    };
  });

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Apply limit
  const limit = options.limit || 50;
  return results.slice(0, limit);
}

/**
 * Get recently visited bookmarks
 */
export async function getRecentBookmarks(limit: number = 10): Promise<Bookmark[]> {
  const bookmarks = await db.bookmarks
    .filter(b => !b.isArchived && b.lastVisited !== undefined)
    .toArray();

  return bookmarks
    .sort((a, b) => (b.lastVisited || 0) - (a.lastVisited || 0))
    .slice(0, limit);
}

/**
 * Get bookmarks by category
 */
export async function getBookmarksByCategory(categoryId: string): Promise<Bookmark[]> {
  return await db.bookmarks
    .where('category')
    .equals(categoryId)
    .filter(b => !b.isArchived)
    .toArray();
}

/**
 * Get archived bookmarks
 */
export async function getArchivedBookmarks(): Promise<Bookmark[]> {
  return await db.bookmarks
    .filter(b => b.isArchived === true)
    .toArray();
}

/**
 * Get bookmark statistics
 */
export async function getBookmarkStats() {
  const all = await db.bookmarks.toArray();
  const active = all.filter(b => !b.isArchived);
  const archived = all.filter(b => b.isArchived);
  const pinned = all.filter(b => b.isPinned);

  const categoryCounts = await db.categories.toArray();

  return {
    total: all.length,
    active: active.length,
    archived: archived.length,
    pinned: pinned.length,
    categories: categoryCounts.map(c => ({
      id: c.id,
      name: c.name,
      count: c.bookmarkCount,
      icon: c.icon,
      color: c.color
    }))
  };
}
