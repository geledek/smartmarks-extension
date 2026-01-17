import { db, type Bookmark } from './db';
import { categorizeBookmark, generateContentHash, findDuplicates } from './categorization';
import { flattenBookmarkTree, hasPermission } from './utils';
import { extractMetadata } from './metadata';
import { loadCheckpoint, saveCheckpoint, clearCheckpoint, cleanupOldCheckpoints } from './checkpoints';

/// <reference types="chrome"/>

// Initialize database on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log('SmartMarks installed');
  await db.initialize();
  await syncBookmarksFromChrome();

  // Clean up old checkpoints
  await cleanupOldCheckpoints();

  // Set up periodic tasks
  chrome.alarms.create('categorize', { periodInMinutes: 15 });
  chrome.alarms.create('archive', { periodInMinutes: 60 * 24 }); // Daily

  // Set up optional history tracking if permission granted
  await setupHistoryTracking();
});

// On startup, check for incomplete jobs and resume them
chrome.runtime.onStartup.addListener(async () => {
  console.log('SmartMarks service worker started');

  // Check for incomplete categorization
  const categorizationCheckpoint = await loadCheckpoint('categorize');
  if (categorizationCheckpoint) {
    console.log('Resuming incomplete categorization task');
    await runCategorizationTask();
  }

  // Check for incomplete archiving
  const archivingCheckpoint = await loadCheckpoint('archive');
  if (archivingCheckpoint) {
    console.log('Resuming incomplete archiving task');
    await runArchivingTask();
  }
});

// Listen to bookmark changes
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  if (bookmark.url) {
    await handleBookmarkAdded(id, bookmark);
  }
});

chrome.bookmarks.onRemoved.addListener(async (id) => {
  await db.bookmarks.delete(id);
});

chrome.bookmarks.onChanged.addListener(async (id, changeInfo) => {
  const bookmark = await db.bookmarks.get(id);
  if (bookmark) {
    await db.bookmarks.update(id, {
      title: changeInfo.title || bookmark.title,
      url: changeInfo.url || bookmark.url
    });
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'categorize') {
    await runCategorizationTask();
  } else if (alarm.name === 'archive') {
    await runArchivingTask();
  }
});

/**
 * Sync bookmarks from Chrome to local database
 */
async function syncBookmarksFromChrome() {
  const bookmarks = await flattenBookmarkTree();

  for (const node of bookmarks) {
    // Check if already exists
    const existing = await db.bookmarks.get(node.id);
    if (!existing) {
      const bookmark: Bookmark = {
        id: node.id,
        url: node.url!,
        title: node.title,
        tags: [],
        dateAdded: node.dateAdded || Date.now(),
        visitCount: 0,
        isPinned: false,
        isArchived: false,
        metadata: {
          contentHash: generateContentHash(node.url!)
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
        await incrementCategoryCount(bookmark.category);
      }
    }
  }
}

/**
 * Handle new bookmark added
 */
async function handleBookmarkAdded(id: string, chromeBookmark: chrome.bookmarks.BookmarkTreeNode) {
  if (!chromeBookmark.url) return;

  const bookmark: Bookmark = {
    id,
    url: chromeBookmark.url,
    title: chromeBookmark.title,
    tags: [],
    dateAdded: chromeBookmark.dateAdded || Date.now(),
    visitCount: 0,
    isPinned: false,
    isArchived: false,
    metadata: {
      contentHash: generateContentHash(chromeBookmark.url)
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
    await incrementCategoryCount(bookmark.category);
  }

  // Fetch metadata asynchronously (don't block)
  fetchAndUpdateMetadata(id, chromeBookmark.url).catch(err => {
    console.debug(`Failed to fetch metadata for ${chromeBookmark.url}:`, err);
  });

  // Show notification for high-confidence categorization
  if (result.confidence >= 0.8 && bookmark.category && bookmark.category !== 'uncategorized') {
    const category = await db.categories.get(bookmark.category);
    if (category) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'SmartMarks',
        message: `Bookmark categorized as ${category.icon} ${category.name}`,
        silent: true
      });
    }
  }
}

/**
 * Fetch and update bookmark metadata
 * Runs asynchronously after bookmark is added
 */
async function fetchAndUpdateMetadata(bookmarkId: string, url: string) {
  const metadata = await extractMetadata(url);

  // Update bookmark with fetched metadata
  await db.bookmarks.update(bookmarkId, {
    metadata: {
      ...metadata,
      contentHash: generateContentHash(url)
    }
  });
}

/**
 * Track visit to a URL
 */
async function trackVisit(url: string) {
  const settings = await db.settings.get('local');
  if (!settings) return;

  // Check if URL is excluded
  const domain = new URL(url).hostname;
  if (settings.excludedDomains.some(d => domain.includes(d))) {
    return;
  }

  // Find bookmark by URL
  const bookmarks = await db.bookmarks.where('url').equals(url).toArray();
  if (bookmarks.length > 0) {
    const bookmark = bookmarks[0];

    // Update visit count and last visited
    await db.bookmarks.update(bookmark.id, {
      lastVisited: Date.now(),
      visitCount: bookmark.visitCount + 1
    });

    // Add to visit history
    await db.visitHistory.add({
      bookmarkId: bookmark.id,
      timestamp: Date.now(),
      duration: 0 // Will be updated when tab closes
    });
  }
}

/**
 * Run categorization task with chunked processing (MV3 compatible)
 * Processes bookmarks in chunks of 100 to avoid service worker termination
 */
async function runCategorizationTask() {
  const CHUNK_SIZE = 100;

  try {
    // Load existing checkpoint or create new one
    let checkpoint = await loadCheckpoint('categorize');

    if (!checkpoint) {
      // Get all uncategorized bookmarks
      const uncategorized = await db.bookmarks
        .filter(b => !b.category || b.category === 'uncategorized')
        .toArray();

      if (uncategorized.length === 0) {
        console.log('No bookmarks to categorize');
        return;
      }

      // Create new checkpoint
      checkpoint = {
        jobType: 'categorize',
        startTime: Date.now(),
        totalItems: uncategorized.length,
        processedCount: 0,
        status: 'running'
      };
      await saveCheckpoint(checkpoint);
      console.log(`Starting categorization of ${uncategorized.length} bookmarks`);
    } else {
      console.log(`Resuming categorization: ${checkpoint.processedCount}/${checkpoint.totalItems}`);
    }

    // Get next chunk to process
    const bookmarksToProcess = await db.bookmarks
      .filter(b => !b.category || b.category === 'uncategorized')
      .limit(CHUNK_SIZE)
      .toArray();

    if (bookmarksToProcess.length === 0) {
      // All done
      await clearCheckpoint('categorize');
      console.log(`Categorization complete: ${checkpoint.totalItems} bookmarks processed`);
      return;
    }

    // Process chunk
    for (const bookmark of bookmarksToProcess) {
      const result = categorizeBookmark(bookmark);

      if (result.confidence >= 0.5) {
        await db.bookmarks.update(bookmark.id, {
          category: result.category
        });

        if (result.category) {
          await incrementCategoryCount(result.category);
        }
      }

      checkpoint.processedCount++;
    }

    // Save checkpoint
    await saveCheckpoint(checkpoint);

    // Schedule next chunk if more to process
    if (checkpoint.processedCount < checkpoint.totalItems) {
      // Use setTimeout to continue processing after a small delay
      // This allows the service worker to yield and prevents blocking
      setTimeout(() => runCategorizationTask(), 100);
    } else {
      // All done
      await clearCheckpoint('categorize');
      console.log(`Categorization complete: ${checkpoint.totalItems} bookmarks processed`);
    }
  } catch (error) {
    console.error('Categorization task failed:', error);
    await clearCheckpoint('categorize');
  }
}

/**
 * Run archiving task with chunked processing (MV3 compatible)
 * Archives inactive bookmarks and duplicates in manageable chunks
 */
async function runArchivingTask() {
  const CHUNK_SIZE = 100;

  try {
    // Check if auto-archive is enabled
    const settings = await db.settings.get('local');
    if (!settings || !settings.autoArchive) {
      console.log('Auto-archive is disabled');
      return;
    }

    // Load existing checkpoint or create new one
    let checkpoint = await loadCheckpoint('archive');

    if (!checkpoint) {
      // Count bookmarks that need archiving
      const now = Date.now();
      const threshold = settings.archiveThreshold * 24 * 60 * 60 * 1000;

      const candidatesForArchiving = await db.bookmarks
        .filter(b => {
          if (b.isPinned || b.isArchived) return false;
          if (b.lastVisited && (now - b.lastVisited) > threshold) return true;
          return false;
        })
        .toArray();

      // Also count duplicates
      const allActive = await db.bookmarks.filter(b => !b.isArchived).toArray();
      const duplicates = findDuplicates(allActive);
      let duplicateCount = 0;
      for (const ids of duplicates.values()) {
        duplicateCount += ids.length - 1; // Keep one, archive others
      }

      const totalToArchive = candidatesForArchiving.length + duplicateCount;

      if (totalToArchive === 0) {
        console.log('No bookmarks to archive');
        return;
      }

      // Create new checkpoint
      checkpoint = {
        jobType: 'archive',
        startTime: Date.now(),
        totalItems: totalToArchive,
        processedCount: 0,
        status: 'running'
      };
      await saveCheckpoint(checkpoint);
      console.log(`Starting archiving of ${totalToArchive} bookmarks`);
    } else {
      console.log(`Resuming archiving: ${checkpoint.processedCount}/${checkpoint.totalItems}`);
    }

    // Phase 1: Archive inactive bookmarks (in chunks)
    const now = Date.now();
    const threshold = settings.archiveThreshold * 24 * 60 * 60 * 1000;

    const inactiveChunk = await db.bookmarks
      .filter(b => {
        if (b.isPinned || b.isArchived) return false;
        if (b.lastVisited && (now - b.lastVisited) > threshold) return true;
        return false;
      })
      .limit(CHUNK_SIZE)
      .toArray();

    for (const bookmark of inactiveChunk) {
      await db.bookmarks.update(bookmark.id, {
        isArchived: true
      });
      checkpoint.processedCount++;
    }

    // Phase 2: Archive duplicates (if inactive chunk is done)
    if (inactiveChunk.length < CHUNK_SIZE) {
      const allActive = await db.bookmarks.filter(b => !b.isArchived).toArray();
      const duplicates = findDuplicates(allActive);

      let duplicatesProcessed = 0;
      for (const [_, ids] of duplicates.entries()) {
        if (duplicatesProcessed >= CHUNK_SIZE) break;

        // Keep the most recently visited, archive others
        const bookmarksToCheck = await db.bookmarks.bulkGet(ids);
        const sorted = bookmarksToCheck
          .filter((b): b is Bookmark => b !== undefined)
          .sort((a, b) => (b.lastVisited || 0) - (a.lastVisited || 0));

        // Archive all except the first (most recent)
        for (let i = 1; i < sorted.length; i++) {
          await db.bookmarks.update(sorted[i].id, {
            isArchived: true
          });
          checkpoint.processedCount++;
          duplicatesProcessed++;
        }
      }
    }

    // Save checkpoint
    await saveCheckpoint(checkpoint);

    // Check if more processing needed
    const stillHasInactive = await db.bookmarks
      .filter(b => {
        if (b.isPinned || b.isArchived) return false;
        if (b.lastVisited && (now - b.lastVisited) > threshold) return true;
        return false;
      })
      .count();

    const allActiveNow = await db.bookmarks.filter(b => !b.isArchived).toArray();
    const remainingDuplicates = findDuplicates(allActiveNow);
    const hasDuplicates = remainingDuplicates.size > 0;

    if (stillHasInactive > 0 || hasDuplicates) {
      // Continue processing
      setTimeout(() => runArchivingTask(), 100);
    } else {
      // All done
      await clearCheckpoint('archive');
      console.log(`Archiving complete: ${checkpoint.processedCount} bookmarks archived`);
    }
  } catch (error) {
    console.error('Archiving task failed:', error);
    await clearCheckpoint('archive');
  }
}

/**
 * Increment category bookmark count
 */
async function incrementCategoryCount(categoryId: string) {
  const category = await db.categories.get(categoryId);
  if (category) {
    await db.categories.update(categoryId, {
      bookmarkCount: category.bookmarkCount + 1
    });
  }
}

/**
 * Set up history tracking if permission is granted
 * This is optional - if user hasn't granted history permission,
 * we track visits only when they click bookmarks in the popup
 */
async function setupHistoryTracking() {
  const hasHistoryPermission = await hasPermission('history');

  if (hasHistoryPermission) {
    // Set up history listener
    chrome.history.onVisited.addListener(async (historyItem) => {
      if (historyItem.url) {
        await trackVisit(historyItem.url);
      }
    });
    console.log('History tracking enabled');
  } else {
    console.log('History tracking disabled - permission not granted');
  }
}

// Listen to permission changes
chrome.permissions.onAdded.addListener(async (permissions) => {
  if (permissions.permissions?.includes('history')) {
    await setupHistoryTracking();
  }
});

chrome.permissions.onRemoved.addListener((permissions) => {
  if (permissions.permissions?.includes('history')) {
    console.log('History tracking disabled - permission removed');
    // Note: Chrome automatically removes listeners when permission is revoked
  }
});

// Listen to messages from popup for fallback visit tracking
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TRACK_BOOKMARK_CLICK') {
    // Track visit when user clicks bookmark in popup (fallback tracking)
    db.bookmarks.get(message.bookmarkId).then(async (bookmark) => {
      if (bookmark) {
        await db.bookmarks.update(bookmark.id, {
          lastVisited: Date.now(),
          visitCount: bookmark.visitCount + 1
        });

        await db.visitHistory.add({
          bookmarkId: bookmark.id,
          timestamp: Date.now(),
          duration: 0
        });
      }
    });
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

// Export for use in other scripts
export { syncBookmarksFromChrome, runCategorizationTask, runArchivingTask, setupHistoryTracking };
