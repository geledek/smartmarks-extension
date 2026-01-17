/// <reference types="chrome"/>

/**
 * Flatten Chrome bookmark tree into a flat array of bookmarks
 * Chrome's bookmarks.getTree() returns a nested tree structure,
 * but we need a flat array for processing
 */
export async function flattenBookmarkTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  const tree = await chrome.bookmarks.getTree();
  const bookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

  function traverse(node: chrome.bookmarks.BookmarkTreeNode) {
    // Only nodes with URLs are actual bookmarks (not folders)
    if (node.url) {
      bookmarks.push(node);
    }

    // Recursively process children
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return bookmarks;
}

/**
 * Check if a specific permission is granted
 */
export async function hasPermission(permission: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.contains(
      { permissions: [permission] as chrome.permissions.Permissions['permissions'] },
      (result) => resolve(result)
    );
  });
}

/**
 * Request a specific permission from the user
 */
export async function requestPermission(permission: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.request(
      { permissions: [permission] as chrome.permissions.Permissions['permissions'] },
      (granted) => resolve(granted)
    );
  });
}

/**
 * Remove a specific permission
 */
export async function removePermission(permission: string): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.permissions.remove(
      { permissions: [permission] as chrome.permissions.Permissions['permissions'] },
      (removed) => resolve(removed)
    );
  });
}

/**
 * Track a bookmark click from the extension popup
 * This is used as fallback when history permission is not granted
 * Called when user clicks a bookmark in the popup
 */
export async function trackBookmarkClick(bookmarkId: string) {
  // Send message to background script to track the visit
  chrome.runtime.sendMessage({
    type: 'TRACK_BOOKMARK_CLICK',
    bookmarkId
  });
}

/**
 * Open a bookmark and track the visit
 */
export async function openBookmark(bookmarkId: string, url: string) {
  // Open in current tab
  chrome.tabs.create({ url });

  // Track the click (fallback tracking if history permission not granted)
  await trackBookmarkClick(bookmarkId);
}
