import { useState, useEffect } from 'react';
import { db } from '../db';
import { searchBookmarks } from '../search';
import { useFirstRun } from '../hooks/useFirstRun';
import { PermissionDialog } from './PermissionDialog';
import { openBookmark } from '../utils';

/**
 * SmartMarks Popup Component
 * Quick search and recently visited bookmarks
 */
export function Popup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { isFirstRun, completeFirstRun } = useFirstRun();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isGroupingTabs, setIsGroupingTabs] = useState(false);

  useEffect(() => {
    loadRecentBookmarks();

    // Show permission dialog on first run
    if (isFirstRun) {
      setShowPermissionDialog(true);
    }
  }, [isFirstRun]);

  async function loadRecentBookmarks() {
    const bookmarks = await db.bookmarks
      .filter(b => !b.isArchived)
      .limit(10)
      .toArray();

    const sorted = bookmarks.sort((a, b) => (b.lastVisited || 0) - (a.lastVisited || 0));
    setRecentBookmarks(sorted.slice(0, 5));
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchBookmarks({
        query: query.trim(),
        includeArchived: false,
        limit: 10
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleBookmarkClick(id: string, url: string) {
    openBookmark(id, url);
  }

  function handlePermissionDialogClose() {
    setShowPermissionDialog(false);
    completeFirstRun();
  }

  // v1.2.0: Group tabs handler
  async function handleGroupTabs() {
    setIsGroupingTabs(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GROUP_TABS' });
      if (response?.success) {
        // Brief success indicator - the user will see the grouped tabs
        console.log(`Grouped ${response.result.grouped} tabs`);
      }
    } catch (error) {
      console.error('Tab grouping error:', error);
    } finally {
      setIsGroupingTabs(false);
    }
  }

  return (
    <div className="w-96 h-[500px] bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-3">SmartMarks</h1>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Results/Recent */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Searching...</div>
        ) : searchQuery.length > 0 ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Search Results ({results.length})
            </h2>
            {results.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No results found</div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.bookmark.id}
                    onClick={() => handleBookmarkClick(result.bookmark.id, result.bookmark.url)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {result.bookmark.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate mt-1">
                      {result.bookmark.url}
                    </div>
                    {result.bookmark.category && (
                      <div className="text-xs text-blue-600 mt-1">{result.bookmark.category}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Recently Visited</h2>
            {recentBookmarks.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No recent bookmarks</div>
            ) : (
              <div className="space-y-2">
                {recentBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    onClick={() => handleBookmarkClick(bookmark.id, bookmark.url)}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-gray-900 truncate">{bookmark.title}</div>
                    <div className="text-sm text-gray-500 truncate mt-1">{bookmark.url}</div>
                    {bookmark.category && (
                      <div className="text-xs text-blue-600 mt-1">{bookmark.category}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 flex gap-2">
        {/* v1.2.0: Group Tabs Button */}
        <button
          onClick={handleGroupTabs}
          disabled={isGroupingTabs}
          className="flex-1 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded hover:bg-purple-50 disabled:opacity-50"
        >
          {isGroupingTabs ? 'Grouping...' : 'Group Tabs'}
        </button>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="flex-1 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Dashboard
        </button>
      </div>

      {/* Permission Dialog */}
      {showPermissionDialog && (
        <PermissionDialog isOpen={true} onClose={handlePermissionDialogClose} />
      )}
    </div>
  );
}
