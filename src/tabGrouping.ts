import { db } from './db';
import { normalizeURL } from './categorization';

/// <reference types="chrome"/>

// Chrome tab group colors
type TabGroupColor = 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan' | 'orange';

// Category colors for tab groups (Chrome's limited palette)
const CATEGORY_COLORS: Record<string, TabGroupColor> = {
  development: 'blue',
  shopping: 'green',
  social: 'purple',
  news: 'red',
  entertainment: 'yellow',
  work: 'cyan',
  research: 'pink',
  finance: 'orange',
  health: 'red',
  education: 'cyan',
  uncategorized: 'grey'
};

// Category display names with icons
const CATEGORY_NAMES: Record<string, string> = {
  development: 'Dev',
  shopping: 'Shop',
  social: 'Social',
  news: 'News',
  entertainment: 'Fun',
  work: 'Work',
  research: 'Research',
  finance: 'Finance',
  health: 'Health',
  education: 'Learn',
  uncategorized: 'Other'
};

interface TabGroupResult {
  grouped: number;
  ungrouped: number;
  groups: Array<{ category: string; tabCount: number; groupId: number }>;
}

/**
 * Extract domain from URL for fallback matching
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
 * Get category for a tab URL by matching against bookmarks
 */
async function getCategoryForUrl(url: string): Promise<string | null> {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return null; // Skip Chrome internal URLs
  }

  const normalizedUrl = normalizeURL(url);
  const domain = extractDomain(url);

  // First, try exact URL match
  const exactMatch = await db.bookmarks
    .where('url')
    .equals(url)
    .first();

  if (exactMatch?.category) {
    return exactMatch.category;
  }

  // Try normalized URL match
  const bookmark = await db.bookmarks
    .filter(b => normalizeURL(b.url) === normalizedUrl)
    .first();

  if (bookmark?.category) {
    return bookmark.category;
  }

  // Try domain-based match (find most common category for this domain)
  const domainBookmarks = await db.bookmarks
    .filter(b => extractDomain(b.url) === domain && !!b.category)
    .toArray();

  if (domainBookmarks.length > 0) {
    // Count categories
    const categoryCounts = new Map<string, number>();
    domainBookmarks.forEach(b => {
      if (b.category) {
        categoryCounts.set(b.category, (categoryCounts.get(b.category) || 0) + 1);
      }
    });

    // Return most common category for this domain
    let maxCount = 0;
    let bestCategory: string | null = null;
    for (const [category, count] of categoryCounts) {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = category;
      }
    }
    return bestCategory;
  }

  return null;
}

/**
 * Group all tabs in the current window by bookmark category
 */
export async function groupTabsByCategory(): Promise<TabGroupResult> {
  // Get all tabs in the current window
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // Map tabs to categories
  const categoryTabs = new Map<string, chrome.tabs.Tab[]>();
  const ungroupedTabs: chrome.tabs.Tab[] = [];

  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;

    // Skip pinned tabs
    if (tab.pinned) continue;

    // Skip tabs already in groups (optional: could ungrouped first)
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      continue;
    }

    const category = await getCategoryForUrl(tab.url);

    if (category) {
      if (!categoryTabs.has(category)) {
        categoryTabs.set(category, []);
      }
      categoryTabs.get(category)!.push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  }

  const result: TabGroupResult = {
    grouped: 0,
    ungrouped: ungroupedTabs.length,
    groups: []
  };

  // Create tab groups for each category
  for (const [category, tabsInCategory] of categoryTabs) {
    if (tabsInCategory.length === 0) continue;

    const tabIds = tabsInCategory
      .map(t => t.id)
      .filter((id): id is number => id !== undefined);

    if (tabIds.length === 0) continue;

    try {
      // Create the group
      const groupId = await chrome.tabs.group({ tabIds: tabIds as [number, ...number[]] });

      // Style the group
      const color = CATEGORY_COLORS[category] || 'grey';
      const title = CATEGORY_NAMES[category] || category;

      await chrome.tabGroups.update(groupId, {
        title,
        color,
        collapsed: false
      });

      result.grouped += tabIds.length;
      result.groups.push({
        category,
        tabCount: tabIds.length,
        groupId
      });
    } catch (error) {
      console.error(`Failed to create tab group for ${category}:`, error);
    }
  }

  console.log(`Tab grouping complete: ${result.grouped} grouped, ${result.ungrouped} ungrouped`);

  return result;
}

/**
 * Ungroup all tabs in the current window
 */
export async function ungroupAllTabs(): Promise<number> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  let ungrouped = 0;

  for (const tab of tabs) {
    if (tab.id && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      try {
        await chrome.tabs.ungroup(tab.id);
        ungrouped++;
      } catch (error) {
        console.error(`Failed to ungroup tab ${tab.id}:`, error);
      }
    }
  }

  return ungrouped;
}

/**
 * Get statistics about current tab groups
 */
export async function getTabGroupStats(): Promise<{
  totalTabs: number;
  groupedTabs: number;
  ungroupedTabs: number;
  groups: Array<{ title: string; color: string; tabCount: number }>;
}> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

  const groupTabCounts = new Map<number, number>();

  for (const tab of tabs) {
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      groupTabCounts.set(tab.groupId, (groupTabCounts.get(tab.groupId) || 0) + 1);
    }
  }

  const groupStats = groups.map(g => ({
    title: g.title || 'Unnamed',
    color: g.color,
    tabCount: groupTabCounts.get(g.id) || 0
  }));

  const groupedTabs = tabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).length;

  return {
    totalTabs: tabs.length,
    groupedTabs,
    ungroupedTabs: tabs.length - groupedTabs,
    groups: groupStats
  };
}

/**
 * Collapse all tab groups
 */
export async function collapseAllGroups(): Promise<void> {
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

  for (const group of groups) {
    try {
      await chrome.tabGroups.update(group.id, { collapsed: true });
    } catch (error) {
      console.error(`Failed to collapse group ${group.id}:`, error);
    }
  }
}

/**
 * Expand all tab groups
 */
export async function expandAllGroups(): Promise<void> {
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });

  for (const group of groups) {
    try {
      await chrome.tabGroups.update(group.id, { collapsed: false });
    } catch (error) {
      console.error(`Failed to expand group ${group.id}:`, error);
    }
  }
}

/**
 * Add a single tab to an appropriate group based on its URL
 */
export async function addTabToGroup(tabId: number, url: string): Promise<boolean> {
  const category = await getCategoryForUrl(url);
  if (!category) return false;

  // Find existing group for this category
  const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT });
  const categoryTitle = CATEGORY_NAMES[category] || category;

  const existingGroup = groups.find(g => g.title === categoryTitle);

  if (existingGroup) {
    // Add to existing group
    await chrome.tabs.group({ tabIds: [tabId], groupId: existingGroup.id });
    return true;
  }

  // Create new group
  const groupId = await chrome.tabs.group({ tabIds: [tabId] });
  await chrome.tabGroups.update(groupId, {
    title: categoryTitle,
    color: CATEGORY_COLORS[category] || 'grey'
  });

  return true;
}
