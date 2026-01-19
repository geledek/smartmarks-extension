import { db, type Bookmark, type CandidateUrl } from './db';
import { categorizeBookmark, normalizeURL, generateContentHash } from './categorization';
import { shouldExcludeUrl } from './naturalLanguageParser';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint } from './checkpoints';
import { hasPermission } from './utils';

/// <reference types="chrome"/>

interface HistoryStats {
  url: string;
  normalizedUrl: string;
  title: string;
  domain: string;
  totalVisits: number;
  weeklyVisits: number;
  monthlyVisits: number;
  quarterlyVisits: number;
  firstVisit: number;
  lastVisit: number;
}

interface AnalysisCheckpoint {
  jobType: 'historyAnalysis';
  startTime: number;
  totalItems: number;
  processedCount: number;
  status: 'running' | 'completed' | 'failed';
  lastProcessedIndex?: number;
  urlStats?: HistoryStats[];
}

const CHUNK_SIZE = 50; // Process 50 URLs at a time

/**
 * Calculate time windows
 */
function getTimeWindows() {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const oneQuarterAgo = now - 90 * 24 * 60 * 60 * 1000;

  return { now, oneWeekAgo, oneMonthAgo, oneQuarterAgo };
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Check if URL meets threshold for auto-bookmarking
 */
export function meetsThreshold(
  stats: HistoryStats,
  weeklyThreshold: number,
  monthlyThreshold: number,
  quarterlyThreshold: number
): boolean {
  return (
    stats.weeklyVisits >= weeklyThreshold ||
    stats.monthlyVisits >= monthlyThreshold ||
    stats.quarterlyVisits >= quarterlyThreshold
  );
}

/**
 * Aggregate history items into stats per URL
 */
async function aggregateHistoryStats(historyItems: chrome.history.HistoryItem[]): Promise<HistoryStats[]> {
  const { oneWeekAgo, oneMonthAgo, oneQuarterAgo } = getTimeWindows();
  const urlStatsMap = new Map<string, HistoryStats>();

  for (const item of historyItems) {
    if (!item.url) continue;

    const normalizedUrl = normalizeURL(item.url);
    const domain = extractDomain(item.url);

    // Skip if no domain (invalid URL)
    if (!domain) continue;

    // Get or create stats entry
    let stats = urlStatsMap.get(normalizedUrl);
    if (!stats) {
      stats = {
        url: item.url,
        normalizedUrl,
        title: item.title || domain,
        domain,
        totalVisits: 0,
        weeklyVisits: 0,
        monthlyVisits: 0,
        quarterlyVisits: 0,
        firstVisit: item.lastVisitTime || Date.now(),
        lastVisit: item.lastVisitTime || Date.now()
      };
      urlStatsMap.set(normalizedUrl, stats);
    }

    // Update visit counts
    const visitTime = item.lastVisitTime || Date.now();
    stats.totalVisits += item.visitCount || 1;

    // Count visits in each window
    if (visitTime >= oneWeekAgo) {
      stats.weeklyVisits += item.visitCount || 1;
    }
    if (visitTime >= oneMonthAgo) {
      stats.monthlyVisits += item.visitCount || 1;
    }
    if (visitTime >= oneQuarterAgo) {
      stats.quarterlyVisits += item.visitCount || 1;
    }

    // Update first/last visit times
    if (visitTime < stats.firstVisit) stats.firstVisit = visitTime;
    if (visitTime > stats.lastVisit) stats.lastVisit = visitTime;

    // Update title if better (longer, not just domain)
    if (item.title && item.title.length > stats.title.length) {
      stats.title = item.title;
    }
  }

  return Array.from(urlStatsMap.values());
}

/**
 * Check if URL is already bookmarked
 */
async function isAlreadyBookmarked(normalizedUrl: string): Promise<boolean> {
  // Check IndexedDB
  const existing = await db.bookmarks
    .filter(b => normalizeURL(b.url) === normalizedUrl)
    .count();

  return existing > 0;
}

/**
 * Check if URL is excluded by settings or natural language rules
 */
async function isExcluded(url: string, title: string, domain: string): Promise<boolean> {
  // Check settings excluded domains
  const settings = await db.settings.get('local');
  if (settings?.excludedDomains.some(d => domain.includes(d))) {
    return true;
  }

  // Check natural language rules
  const excluded = await shouldExcludeUrl(url, title);
  return excluded;
}

/**
 * Create a Chrome bookmark and IndexedDB entry from history stats
 */
async function createBookmarkFromStats(stats: HistoryStats): Promise<string | null> {
  try {
    // Create Chrome bookmark
    const chromeBookmark = await chrome.bookmarks.create({
      title: stats.title,
      url: stats.url
    });

    // Create IndexedDB entry
    const bookmark: Bookmark = {
      id: chromeBookmark.id,
      url: stats.url,
      title: stats.title,
      tags: ['auto-created'],
      dateAdded: Date.now(),
      lastVisited: stats.lastVisit,
      visitCount: stats.totalVisits,
      isPinned: false,
      isArchived: false,
      metadata: {
        contentHash: generateContentHash(stats.url)
      }
    };

    // Auto-categorize
    const result = categorizeBookmark(bookmark);
    if (result.confidence >= 0.5) {
      bookmark.category = result.category;
    }

    await db.bookmarks.add(bookmark);

    // Update category count
    if (bookmark.category) {
      const category = await db.categories.get(bookmark.category);
      if (category) {
        await db.categories.update(bookmark.category, {
          bookmarkCount: category.bookmarkCount + 1
        });
      }
    }

    console.log(`Auto-created bookmark: ${stats.title} (${stats.domain})`);
    return chromeBookmark.id;
  } catch (error) {
    console.error(`Failed to create bookmark for ${stats.url}:`, error);
    return null;
  }
}

/**
 * Add URL to candidates table for future tracking
 */
async function addToCandidate(stats: HistoryStats): Promise<void> {
  // Check if already in candidates
  const existing = await db.candidateUrls
    .where('normalizedUrl')
    .equals(stats.normalizedUrl)
    .first();

  if (existing) {
    // Update existing
    await db.candidateUrls.update(existing.id!, {
      visitCount: stats.totalVisits,
      weeklyVisits: stats.weeklyVisits,
      monthlyVisits: stats.monthlyVisits,
      quarterlyVisits: stats.quarterlyVisits,
      lastSeen: stats.lastVisit
    });
  } else {
    // Create new candidate
    const candidate: Omit<CandidateUrl, 'id'> = {
      url: stats.url,
      normalizedUrl: stats.normalizedUrl,
      title: stats.title,
      domain: stats.domain,
      firstSeen: stats.firstVisit,
      lastSeen: stats.lastVisit,
      visitCount: stats.totalVisits,
      weeklyVisits: stats.weeklyVisits,
      monthlyVisits: stats.monthlyVisits,
      quarterlyVisits: stats.quarterlyVisits,
      status: 'tracking'
    };
    await db.candidateUrls.add(candidate);
  }
}

/**
 * Main entry point: Analyze existing browsing history
 * Creates bookmarks for frequently visited URLs
 */
export async function analyzeExistingHistory(): Promise<{
  analyzed: number;
  bookmarksCreated: number;
  candidatesAdded: number;
}> {
  // Check history permission
  const hasHistoryPermission = await hasPermission('history');
  if (!hasHistoryPermission) {
    console.log('History permission not granted, skipping analysis');
    return { analyzed: 0, bookmarksCreated: 0, candidatesAdded: 0 };
  }

  // Get settings
  const settings = await db.settings.get('local');
  if (!settings || !settings.autoBookmarkEnabled) {
    console.log('Auto-bookmarking disabled');
    return { analyzed: 0, bookmarksCreated: 0, candidatesAdded: 0 };
  }

  const { weeklyVisitThreshold, monthlyVisitThreshold, quarterlyVisitThreshold } = settings;
  const { oneQuarterAgo } = getTimeWindows();

  // Load or create checkpoint
  let checkpoint = await loadCheckpoint('historyAnalysis') as AnalysisCheckpoint | null;

  let urlStats: HistoryStats[];

  if (checkpoint?.urlStats) {
    console.log(`Resuming history analysis: ${checkpoint.processedCount}/${checkpoint.totalItems}`);
    urlStats = checkpoint.urlStats;
  } else {
    // Fetch history
    console.log('Fetching browsing history for analysis...');
    const historyItems = await chrome.history.search({
      text: '',
      maxResults: 10000,
      startTime: oneQuarterAgo
    });

    console.log(`Found ${historyItems.length} history items`);

    // Aggregate stats
    urlStats = await aggregateHistoryStats(historyItems);
    console.log(`Aggregated into ${urlStats.length} unique URLs`);

    // Create checkpoint
    checkpoint = {
      jobType: 'historyAnalysis',
      startTime: Date.now(),
      totalItems: urlStats.length,
      processedCount: 0,
      status: 'running',
      lastProcessedIndex: 0,
      urlStats
    };
    await saveCheckpoint(checkpoint);
  }

  const startIndex = checkpoint.lastProcessedIndex || 0;
  const endIndex = Math.min(startIndex + CHUNK_SIZE, urlStats.length);

  let bookmarksCreated = 0;
  let candidatesAdded = 0;

  // Process chunk
  for (let i = startIndex; i < endIndex; i++) {
    const stats = urlStats[i];

    // Skip if already bookmarked
    if (await isAlreadyBookmarked(stats.normalizedUrl)) {
      checkpoint.processedCount++;
      continue;
    }

    // Skip if excluded
    if (await isExcluded(stats.url, stats.title, stats.domain)) {
      checkpoint.processedCount++;
      continue;
    }

    // Check if meets threshold
    if (meetsThreshold(stats, weeklyVisitThreshold, monthlyVisitThreshold, quarterlyVisitThreshold)) {
      const bookmarkId = await createBookmarkFromStats(stats);
      if (bookmarkId) {
        bookmarksCreated++;
      }
    } else {
      // Add to candidates for future tracking
      await addToCandidate(stats);
      candidatesAdded++;
    }

    checkpoint.processedCount++;
  }

  // Update checkpoint
  checkpoint.lastProcessedIndex = endIndex;
  await saveCheckpoint(checkpoint);

  // Check if more to process
  if (endIndex < urlStats.length) {
    // Schedule next chunk
    console.log(`History analysis: ${endIndex}/${urlStats.length} processed, scheduling next chunk`);
    setTimeout(() => analyzeExistingHistory(), 100);
  } else {
    // All done
    await clearCheckpoint('historyAnalysis');

    // Update settings with analysis timestamp
    await db.settings.update('local', {
      historyAnalyzedAt: Date.now()
    });

    console.log(`History analysis complete: ${bookmarksCreated} bookmarks created, ${candidatesAdded} candidates added`);
  }

  return {
    analyzed: checkpoint.processedCount,
    bookmarksCreated,
    candidatesAdded
  };
}

/**
 * Check if history analysis has been completed
 */
export async function hasAnalyzedHistory(): Promise<boolean> {
  const settings = await db.settings.get('local');
  return !!settings?.historyAnalyzedAt;
}

/**
 * Reset history analysis (for re-analysis)
 */
export async function resetHistoryAnalysis(): Promise<void> {
  await db.settings.update('local', {
    historyAnalyzedAt: undefined
  });
  await clearCheckpoint('historyAnalysis');
  console.log('History analysis reset');
}

/**
 * Get analysis statistics
 */
export async function getAnalysisStats(): Promise<{
  hasAnalyzed: boolean;
  analyzedAt?: number;
  candidateCount: number;
  activeBookmarks: number;
}> {
  const settings = await db.settings.get('local');
  const candidateCount = await db.candidateUrls.count();
  const activeBookmarks = await db.bookmarks.filter(b => !b.isArchived).count();

  return {
    hasAnalyzed: !!settings?.historyAnalyzedAt,
    analyzedAt: settings?.historyAnalyzedAt,
    candidateCount,
    activeBookmarks
  };
}
