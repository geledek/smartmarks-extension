import { db, type Bookmark, type CandidateUrl } from './db';
import { categorizeBookmark, normalizeURL, generateContentHash } from './categorization';
import { shouldExcludeUrl } from './naturalLanguageParser';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint } from './checkpoints';

/// <reference types="chrome"/>

const CHUNK_SIZE = 100; // Process 100 candidates at a time

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
 * Get time windows for visit counting
 */
function getTimeWindows() {
  const now = Date.now();
  return {
    now,
    oneWeekAgo: now - 7 * 24 * 60 * 60 * 1000,
    oneMonthAgo: now - 30 * 24 * 60 * 60 * 1000,
    oneQuarterAgo: now - 90 * 24 * 60 * 60 * 1000
  };
}

/**
 * Track a URL that is not yet bookmarked
 * Called from trackVisit() in background.ts when URL is not bookmarked
 */
export async function trackCandidateUrl(url: string, title?: string): Promise<void> {
  const normalizedUrl = normalizeURL(url);
  const domain = extractDomain(url);

  if (!domain) return; // Invalid URL

  // Check if URL should be excluded
  const excluded = await shouldExcludeUrl(url, title || domain);
  if (excluded) {
    // Mark as excluded if it exists in candidates
    await db.candidateUrls
      .where('normalizedUrl')
      .equals(normalizedUrl)
      .modify({ status: 'excluded' });
    return;
  }

  // Check settings for excluded domains
  const settings = await db.settings.get('local');
  if (settings?.excludedDomains.some(d => domain.includes(d))) {
    return;
  }

  // Check if already exists as candidate
  const existing = await db.candidateUrls
    .where('normalizedUrl')
    .equals(normalizedUrl)
    .first();

  const now = Date.now();

  if (existing) {
    // Update existing candidate
    if (existing.status === 'tracking') {
      await db.candidateUrls.update(existing.id!, {
        visitCount: existing.visitCount + 1,
        lastSeen: now,
        title: title && title.length > existing.title.length ? title : existing.title
      });

      // Check if it now meets threshold
      await checkAndPromoteCandidate(existing.id!);
    }
  } else {
    // Create new candidate
    const candidate: Omit<CandidateUrl, 'id'> = {
      url,
      normalizedUrl,
      title: title || domain,
      domain,
      firstSeen: now,
      lastSeen: now,
      visitCount: 1,
      weeklyVisits: 1,
      monthlyVisits: 1,
      quarterlyVisits: 1,
      status: 'tracking'
    };

    await db.candidateUrls.add(candidate);
  }
}

/**
 * Check if a candidate meets the threshold and promote to bookmark
 */
export async function checkAndPromoteCandidate(candidateId: number): Promise<boolean> {
  const candidate = await db.candidateUrls.get(candidateId);
  if (!candidate || candidate.status !== 'tracking') {
    return false;
  }

  const settings = await db.settings.get('local');
  if (!settings || !settings.autoBookmarkEnabled) {
    return false;
  }

  const { weeklyVisitThreshold, monthlyVisitThreshold, quarterlyVisitThreshold } = settings;

  // Check if meets any threshold
  const meetsThreshold =
    candidate.weeklyVisits >= weeklyVisitThreshold ||
    candidate.monthlyVisits >= monthlyVisitThreshold ||
    candidate.quarterlyVisits >= quarterlyVisitThreshold;

  if (meetsThreshold) {
    await promoteToBookmark(candidate);
    return true;
  }

  return false;
}

/**
 * Convert a candidate URL to a full bookmark
 */
export async function promoteToBookmark(candidate: CandidateUrl): Promise<string | null> {
  try {
    // Check if not already bookmarked
    const existingBookmark = await db.bookmarks
      .where('url')
      .equals(candidate.url)
      .first();

    if (existingBookmark) {
      // Already bookmarked, just update candidate status
      await db.candidateUrls.update(candidate.id!, { status: 'promoted' });
      return existingBookmark.id;
    }

    // Create Chrome bookmark
    const chromeBookmark = await chrome.bookmarks.create({
      title: candidate.title,
      url: candidate.url
    });

    // Create IndexedDB entry
    const bookmark: Bookmark = {
      id: chromeBookmark.id,
      url: candidate.url,
      title: candidate.title,
      tags: ['auto-created'],
      dateAdded: Date.now(),
      lastVisited: candidate.lastSeen,
      visitCount: candidate.visitCount,
      isPinned: false,
      isArchived: false,
      metadata: {
        contentHash: generateContentHash(candidate.url)
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

    // Mark candidate as promoted
    await db.candidateUrls.update(candidate.id!, { status: 'promoted' });

    console.log(`Promoted candidate to bookmark: ${candidate.title} (${candidate.domain})`);

    // Optionally show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'SmartMarks',
      message: `Auto-bookmarked: ${candidate.title}`,
      silent: true
    });

    return chromeBookmark.id;
  } catch (error) {
    console.error(`Failed to promote candidate ${candidate.url}:`, error);
    return null;
  }
}

/**
 * Dismiss a candidate (user doesn't want it bookmarked)
 */
export async function dismissCandidate(candidateId: number, reason?: string): Promise<void> {
  await db.candidateUrls.update(candidateId, {
    status: 'dismissed'
  });
  console.log(`Candidate ${candidateId} dismissed${reason ? `: ${reason}` : ''}`);
}

/**
 * Recalculate time-windowed visit counts for all tracking candidates
 * Should be run periodically (e.g., hourly) to keep window counts accurate
 */
export async function recalculateCandidateWindowVisits(): Promise<number> {
  const settings = await db.settings.get('local');
  if (!settings || !settings.autoBookmarkEnabled) {
    return 0;
  }

  // Load or create checkpoint
  let checkpoint = await loadCheckpoint('candidateRecalculation');

  if (!checkpoint) {
    const trackingCount = await db.candidateUrls
      .where('status')
      .equals('tracking')
      .count();

    if (trackingCount === 0) {
      return 0;
    }

    checkpoint = {
      jobType: 'candidateRecalculation',
      startTime: Date.now(),
      totalItems: trackingCount,
      processedCount: 0,
      status: 'running'
    };
    await saveCheckpoint(checkpoint);
  }

  const { oneWeekAgo, oneMonthAgo, oneQuarterAgo } = getTimeWindows();

  // Get chunk of candidates to process
  const candidates = await db.candidateUrls
    .where('status')
    .equals('tracking')
    .limit(CHUNK_SIZE)
    .toArray();

  let promotedCount = 0;

  for (const candidate of candidates) {
    // Query visit history for this URL
    // Note: We're using the visitHistory table which tracks bookmark visits,
    // but for candidates we need to estimate from lastSeen and visitCount
    // A more accurate approach would track individual visits, but that's more complex

    // Simple estimation based on decay
    const daysSinceLastVisit = (Date.now() - candidate.lastSeen) / (24 * 60 * 60 * 1000);

    // If visited recently, count it in the appropriate windows
    const weeklyVisits = candidate.lastSeen >= oneWeekAgo ? Math.min(candidate.visitCount, 7) : 0;
    const monthlyVisits = candidate.lastSeen >= oneMonthAgo ? Math.min(candidate.visitCount, 30) : 0;
    const quarterlyVisits = candidate.lastSeen >= oneQuarterAgo ? candidate.visitCount : 0;

    // Update window counts
    await db.candidateUrls.update(candidate.id!, {
      weeklyVisits,
      monthlyVisits,
      quarterlyVisits
    });

    // Check if now meets threshold
    const meetsThreshold =
      weeklyVisits >= settings.weeklyVisitThreshold ||
      monthlyVisits >= settings.monthlyVisitThreshold ||
      quarterlyVisits >= settings.quarterlyVisitThreshold;

    if (meetsThreshold) {
      const promoted = await promoteToBookmark({
        ...candidate,
        weeklyVisits,
        monthlyVisits,
        quarterlyVisits
      });
      if (promoted) {
        promotedCount++;
      }
    }

    // Remove stale candidates (not seen in 90+ days)
    if (daysSinceLastVisit > 90) {
      await db.candidateUrls.delete(candidate.id!);
    }

    checkpoint.processedCount++;
  }

  // Save checkpoint
  await saveCheckpoint(checkpoint);

  // Check if more to process
  const remainingCount = await db.candidateUrls
    .where('status')
    .equals('tracking')
    .count();

  if (remainingCount > 0 && candidates.length === CHUNK_SIZE) {
    // More to process, schedule next chunk
    setTimeout(() => recalculateCandidateWindowVisits(), 100);
  } else {
    // All done
    await clearCheckpoint('candidateRecalculation');
    console.log(`Candidate recalculation complete, ${promotedCount} promoted to bookmarks`);
  }

  return promotedCount;
}

/**
 * Get candidate URL statistics
 */
export async function getCandidateStats(): Promise<{
  tracking: number;
  promoted: number;
  dismissed: number;
  excluded: number;
}> {
  const all = await db.candidateUrls.toArray();

  return {
    tracking: all.filter(c => c.status === 'tracking').length,
    promoted: all.filter(c => c.status === 'promoted').length,
    dismissed: all.filter(c => c.status === 'dismissed').length,
    excluded: all.filter(c => c.status === 'excluded').length
  };
}

/**
 * Get top candidate URLs (most likely to become bookmarks)
 */
export async function getTopCandidates(limit: number = 10): Promise<CandidateUrl[]> {
  const settings = await db.settings.get('local');
  if (!settings) return [];

  const candidates = await db.candidateUrls
    .where('status')
    .equals('tracking')
    .toArray();

  // Score candidates by how close they are to thresholds
  const scored = candidates.map(c => {
    const weeklyProgress = c.weeklyVisits / settings.weeklyVisitThreshold;
    const monthlyProgress = c.monthlyVisits / settings.monthlyVisitThreshold;
    const quarterlyProgress = c.quarterlyVisits / settings.quarterlyVisitThreshold;

    // Use the highest progress ratio
    const score = Math.max(weeklyProgress, monthlyProgress, quarterlyProgress);

    return { candidate: c, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(s => s.candidate);
}

/**
 * Check if a URL is being tracked as a candidate
 */
export async function isCandidate(url: string): Promise<boolean> {
  const normalizedUrl = normalizeURL(url);
  const count = await db.candidateUrls
    .where('normalizedUrl')
    .equals(normalizedUrl)
    .count();
  return count > 0;
}
