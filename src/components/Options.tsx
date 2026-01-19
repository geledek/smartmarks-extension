import { useState, useEffect, useCallback } from 'react';
import { db, type Bookmark, type Settings } from '../db';
import { HistoryPermissionToggle } from './PermissionDialog';
import { hasPermission } from '../utils';

/**
 * SmartMarks Options/Dashboard Component
 * Full dashboard with stats, archive management, and settings
 */
export function Options() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    archived: 0,
    byCategory: [] as Array<{ category: string; count: number; bookmarks: Bookmark[] }>
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cleanup' | 'settings'>('dashboard');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [exportingToChrome, setExportingToChrome] = useState(false);

  // v1.2.0: New state for auto-bookmarking and tab grouping
  const [settings, setSettings] = useState<Settings | null>(null);
  const [preferencesText, setPreferencesText] = useState('');
  const [interpretedRules, setInterpretedRules] = useState<string[]>([]);
  const [isGroupingTabs, setIsGroupingTabs] = useState(false);
  const [isAnalyzingHistory, setIsAnalyzingHistory] = useState(false);
  const [hasHistoryPermission, setHasHistoryPermission] = useState(false);
  const [analysisStats, setAnalysisStats] = useState<{
    hasAnalyzed: boolean;
    analyzedAt?: number;
    candidateCount: number;
    activeBookmarks: number;
  } | null>(null);

  // Load settings and check permissions
  const loadSettings = useCallback(async () => {
    const s = await db.settings.get('local');
    setSettings(s || null);
    if (s?.naturalLanguagePreferences) {
      setPreferencesText(s.naturalLanguagePreferences);
      // Parse and display current rules
      const response = await chrome.runtime.sendMessage({
        type: 'PARSE_PREFERENCES',
        text: s.naturalLanguagePreferences
      });
      if (response?.success) {
        setInterpretedRules(response.rules);
      }
    }

    const historyPerm = await hasPermission('history');
    setHasHistoryPermission(historyPerm);

    if (historyPerm) {
      const statsResponse = await chrome.runtime.sendMessage({ type: 'GET_ANALYSIS_STATS' });
      if (statsResponse?.success) {
        setAnalysisStats(statsResponse.stats);
      }
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, [loadSettings]);

  async function loadStats() {
    const allBookmarks = await db.bookmarks.toArray();
    const activeBookmarks = allBookmarks.filter(b => !b.isArchived);
    const archivedBookmarks = allBookmarks.filter(b => !b.isArchived);

    // Group by category with bookmarks
    const categoryMap = new Map<string, Bookmark[]>();
    activeBookmarks.forEach(bookmark => {
      const category = bookmark.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(bookmark);
    });

    setStats({
      total: allBookmarks.length,
      active: activeBookmarks.length,
      archived: archivedBookmarks.length,
      byCategory: Array.from(categoryMap.entries()).map(([category, bookmarks]) => ({
        category,
        count: bookmarks.length,
        bookmarks: bookmarks.sort((a, b) => a.title.localeCompare(b.title))
      }))
    });
  }

  function toggleCategory(category: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  }

  function handleEditBookmark(bookmark: Bookmark) {
    setEditingBookmark(bookmark);
  }

  async function handleSaveBookmark(updatedBookmark: Bookmark) {
    try {
      // Update in IndexedDB
      await db.bookmarks.update(updatedBookmark.id, {
        title: updatedBookmark.title,
        url: updatedBookmark.url,
        category: updatedBookmark.category
      });

      // Update in Chrome bookmarks
      await chrome.bookmarks.update(updatedBookmark.id, {
        title: updatedBookmark.title,
        url: updatedBookmark.url
      });

      setEditingBookmark(null);
      await loadStats();
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      alert('Failed to update bookmark. See console for details.');
    }
  }

  async function handleDeleteBookmark(bookmarkId: string) {
    if (!confirm('Are you sure you want to delete this bookmark?')) {
      return;
    }

    try {
      // Delete from Chrome bookmarks
      await chrome.bookmarks.remove(bookmarkId);

      // Delete from IndexedDB
      await db.bookmarks.delete(bookmarkId);

      setEditingBookmark(null);
      await loadStats();
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
      alert('Failed to delete bookmark. See console for details.');
    }
  }

  // v1.2.0: Tab grouping handler
  async function handleGroupTabs() {
    setIsGroupingTabs(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GROUP_TABS' });
      if (response?.success) {
        alert(`Grouped ${response.result.grouped} tabs into ${response.result.groups.length} groups. ${response.result.ungrouped} tabs could not be grouped.`);
      } else {
        alert('Failed to group tabs: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Tab grouping error:', error);
      alert('Failed to group tabs. See console for details.');
    } finally {
      setIsGroupingTabs(false);
    }
  }

  // v1.2.0: History analysis handler
  async function handleAnalyzeHistory() {
    if (!hasHistoryPermission) {
      alert('History permission is required. Please enable it in the Permissions section.');
      return;
    }

    setIsAnalyzingHistory(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'ANALYZE_HISTORY' });
      if (response?.success) {
        alert(`History analysis started. ${response.result.bookmarksCreated} bookmarks created so far, ${response.result.candidatesAdded} candidates added.`);
        await loadSettings();
        await loadStats();
      } else {
        alert('Failed to analyze history: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('History analysis error:', error);
      alert('Failed to analyze history. See console for details.');
    } finally {
      setIsAnalyzingHistory(false);
    }
  }

  // v1.2.0: Save natural language preferences
  async function handleSavePreferences() {
    try {
      // Save to settings
      await db.settings.update('local', {
        naturalLanguagePreferences: preferencesText
      });

      // Parse and save rules
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_PREFERENCES',
        text: preferencesText
      });

      if (response?.success) {
        setInterpretedRules(response.rules);
        alert('Preferences saved successfully!');
      } else {
        alert('Failed to save preferences: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. See console for details.');
    }
  }

  // v1.2.0: Preview rules without saving
  async function handlePreviewRules() {
    const response = await chrome.runtime.sendMessage({
      type: 'PARSE_PREFERENCES',
      text: preferencesText
    });

    if (response?.success) {
      setInterpretedRules(response.rules);
    }
  }

  // v1.2.0: Toggle auto-bookmarking
  async function handleToggleAutoBookmark() {
    if (!settings) return;

    const newValue = !settings.autoBookmarkEnabled;
    await db.settings.update('local', { autoBookmarkEnabled: newValue });
    setSettings({ ...settings, autoBookmarkEnabled: newValue });
  }

  async function exportToChromeBookmarkFolders() {
    if (!confirm('This will create category folders in your Chrome bookmarks and organize all SmartMarks bookmarks into them. Continue?')) {
      return;
    }

    setExportingToChrome(true);

    try {
      // Get or create SmartMarks root folder
      const rootFolders = await chrome.bookmarks.getTree();
      const bookmarkBar = rootFolders[0]?.children?.find(n => n.id === '1'); // Bookmark bar

      if (!bookmarkBar) {
        throw new Error('Bookmark bar not found');
      }

      // Check if SmartMarks folder exists
      let smartMarksFolder = bookmarkBar.children?.find(n => n.title === 'SmartMarks');

      if (!smartMarksFolder) {
        // Create SmartMarks root folder
        smartMarksFolder = await chrome.bookmarks.create({
          parentId: bookmarkBar.id,
          title: 'SmartMarks'
        });
      }

      // Create category folders and move bookmarks
      for (const { category, bookmarks } of stats.byCategory) {
        // Create category folder
        const categoryFolder = await chrome.bookmarks.create({
          parentId: smartMarksFolder.id,
          title: category
        });

        // Move bookmarks to category folder
        for (const bookmark of bookmarks) {
          try {
            await chrome.bookmarks.move(bookmark.id, {
              parentId: categoryFolder.id
            });
          } catch (error) {
            console.warn(`Failed to move bookmark ${bookmark.id}:`, error);
          }
        }
      }

      alert(`Successfully organized ${stats.active} bookmarks into ${stats.byCategory.length} category folders under "SmartMarks"!`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export to Chrome folders. See console for details.');
    } finally {
      setExportingToChrome(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">SmartMarks Dashboard</h1>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 border-t border-gray-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('cleanup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cleanup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cleanup & Archive
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Bookmarks</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.active}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Archived</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.archived}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
              {/* v1.2.0: Group Tabs Button */}
              <div>
                <button
                  onClick={handleGroupTabs}
                  disabled={isGroupingTabs}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  {isGroupingTabs ? 'Grouping...' : 'Group Open Tabs'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Organize open tabs into groups by bookmark category
                </p>
              </div>

              {/* Export Button */}
              <div>
                <button
                  onClick={exportToChromeBookmarkFolders}
                  disabled={exportingToChrome || stats.byCategory.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {exportingToChrome ? 'Exporting...' : 'Export to Chrome Folders'}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Organize bookmarks into category folders
                </p>
              </div>
            </div>

            {/* Expandable Categories */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bookmarks by Category</h2>
              <div className="space-y-2">
                {stats.byCategory.map(({ category, count, bookmarks }) => (
                  <div key={category} className="border border-gray-200 rounded-lg">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex justify-between items-center p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <svg
                          className={`h-5 w-5 text-gray-400 transition-transform ${
                            expandedCategories.has(category) ? 'transform rotate-90' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count}</span>
                    </button>

                    {/* Expanded Bookmark List */}
                    {expandedCategories.has(category) && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        <div className="p-3 space-y-2">
                          {bookmarks.map((bookmark) => (
                            <div
                              key={bookmark.id}
                              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {bookmark.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {bookmark.url}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditBookmark(bookmark)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <a
                                  href={bookmark.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-600 hover:text-gray-800"
                                  title="Open"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cleanup' && (
          <CleanupAndArchiveTab bookmarks={stats.byCategory.flatMap(c => c.bookmarks)} onRefresh={loadStats} />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Permissions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Permissions</h2>
              <HistoryPermissionToggle />
            </div>

            {/* v1.2.0: Auto-Bookmarking Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Auto-Bookmarking</h2>

              <div className="space-y-4">
                {/* Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable Auto-Bookmarking</p>
                    <p className="text-xs text-gray-500">Automatically create bookmarks for frequently visited sites</p>
                  </div>
                  <button
                    onClick={handleToggleAutoBookmark}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings?.autoBookmarkEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings?.autoBookmarkEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Thresholds */}
                {settings?.autoBookmarkEnabled && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Visit Thresholds</p>
                    <p className="text-xs text-gray-500 mb-3">
                      Sites are auto-bookmarked when any threshold is met:
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded border">
                        <div className="text-2xl font-bold text-blue-600">{settings.weeklyVisitThreshold}</div>
                        <div className="text-xs text-gray-500">visits/week</div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-2xl font-bold text-green-600">{settings.monthlyVisitThreshold}</div>
                        <div className="text-xs text-gray-500">visits/month</div>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-2xl font-bold text-purple-600">{settings.quarterlyVisitThreshold}</div>
                        <div className="text-xs text-gray-500">visits/quarter</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Analysis */}
                {hasHistoryPermission && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Analyze Browsing History</p>
                        <p className="text-xs text-gray-500">
                          {analysisStats?.hasAnalyzed
                            ? `Last analyzed: ${new Date(analysisStats.analyzedAt!).toLocaleDateString()}`
                            : 'Scan your history to find frequently visited sites'}
                        </p>
                      </div>
                      <button
                        onClick={handleAnalyzeHistory}
                        disabled={isAnalyzingHistory}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {isAnalyzingHistory ? 'Analyzing...' : analysisStats?.hasAnalyzed ? 'Re-analyze' : 'Analyze Now'}
                      </button>
                    </div>
                    {analysisStats && (
                      <div className="text-xs text-gray-500">
                        {analysisStats.candidateCount} URLs being tracked | {analysisStats.activeBookmarks} active bookmarks
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* v1.2.0: Natural Language Preferences */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Smart Preferences</h2>
              <p className="text-sm text-gray-500 mb-4">
                Describe what to keep or ignore in plain text. For example:
                <br />
                <span className="text-gray-400 italic">"Keep all my work stuff", "Ignore news sites", "Always save github.com"</span>
              </p>

              <textarea
                value={preferencesText}
                onChange={(e) => setPreferencesText(e.target.value)}
                onBlur={handlePreviewRules}
                placeholder="Keep all my work stuff&#10;Ignore news sites except techcrunch.com&#10;Don't track shopping&#10;Always save github.com"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
              />

              {interpretedRules.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Interpreted Rules:</p>
                  <ul className="space-y-1 text-sm">
                    {interpretedRules.map((rule, index) => (
                      <li key={index} className="text-gray-600">{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handlePreviewRules}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Preview Rules
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Preferences
                </button>
              </div>
            </div>

            {/* About */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
              <p className="text-gray-600">
                SmartMarks v1.2.0 - Local-first bookmark organization
              </p>
              <p className="text-gray-500 text-sm mt-2">
                All data stays on your device. No external servers. No tracking.
              </p>
              <p className="text-gray-400 text-xs mt-4">
                New in v1.2.0: Auto-bookmarking, tab grouping, natural language preferences
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Bookmark Modal */}
      {editingBookmark && (
        <EditBookmarkModal
          bookmark={editingBookmark}
          onSave={handleSaveBookmark}
          onDelete={handleDeleteBookmark}
          onCancel={() => setEditingBookmark(null)}
        />
      )}
    </div>
  );
}

// Cleanup & Archive Tab Component
interface CleanupAndArchiveTabProps {
  bookmarks: Bookmark[];
  onRefresh: () => Promise<void>;
}

function CleanupAndArchiveTab({ bookmarks, onRefresh }: CleanupAndArchiveTabProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());

  // Calculate stats
  const now = Date.now();
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  // False Positives: Auto-added recently but never revisited
  const falsePositives = bookmarks.filter(b =>
    !b.isArchived &&
    b.visitCount > 0 && // Was visited (that's why it was auto-added)
    !b.lastVisited && // But never tracked as visited (might be before history permission)
    (now - b.dateAdded) < oneMonth // Added recently
  );

  // Fading Favorites: Used to be active, now going stale
  const fadingFavorites = bookmarks.filter(b =>
    !b.isArchived &&
    b.lastVisited &&
    (now - b.lastVisited) > 30 * 24 * 60 * 60 * 1000 && // Not visited in 30+ days
    b.visitCount >= 3 // But was active before
  );

  // Group duplicates by URL
  const duplicateGroups = new Map<string, Bookmark[]>();
  bookmarks.filter(b => !b.isArchived).forEach(bookmark => {
    const url = bookmark.url.toLowerCase().replace(/\/$/, ''); // Normalize URL
    if (!duplicateGroups.has(url)) {
      duplicateGroups.set(url, []);
    }
    duplicateGroups.get(url)!.push(bookmark);
  });
  const duplicates = Array.from(duplicateGroups.values()).filter(group => group.length > 1);

  // Archived bookmarks
  const archivedBookmarks = bookmarks.filter(b => b.isArchived);

  async function handleBulkArchive(bookmarkIds: string[]) {
    if (!confirm(`Archive ${bookmarkIds.length} bookmark(s)?`)) return;

    try {
      for (const id of bookmarkIds) {
        await db.bookmarks.update(id, { isArchived: true });
      }
      setSelectedBookmarks(new Set());
      await onRefresh();
    } catch (error) {
      console.error('Failed to archive bookmarks:', error);
      alert('Failed to archive bookmarks. See console for details.');
    }
  }

  async function handleBulkDelete(bookmarkIds: string[]) {
    if (!confirm(`Permanently delete ${bookmarkIds.length} bookmark(s)? This cannot be undone.`)) return;

    try {
      for (const id of bookmarkIds) {
        await chrome.bookmarks.remove(id);
        await db.bookmarks.delete(id);
      }
      setSelectedBookmarks(new Set());
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete bookmarks:', error);
      alert('Failed to delete bookmarks. See console for details.');
    }
  }

  async function handleRestore(bookmarkId: string) {
    try {
      await db.bookmarks.update(bookmarkId, { isArchived: false });
      await onRefresh();
    } catch (error) {
      console.error('Failed to restore bookmark:', error);
      alert('Failed to restore bookmark. See console for details.');
    }
  }

  async function handleKeepDuplicate(groupUrl: string, keepId: string) {
    const group = duplicateGroups.get(groupUrl);
    if (!group) return;

    const toDelete = group.filter(b => b.id !== keepId).map(b => b.id);
    await handleBulkDelete(toDelete);
  }

  function toggleSection(section: string) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  function toggleBookmark(id: string) {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBookmarks(newSelected);
  }

  function selectAll(bookmarkIds: string[]) {
    setSelectedBookmarks(new Set(bookmarkIds));
  }

  return (
    <div className="space-y-4">
      {/* False Positives Section */}
      <div className="bg-white shadow rounded-lg">
        <button
          onClick={() => toggleSection('false-positives')}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedSection === 'false-positives' ? 'transform rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">⚠️ False Positives</h3>
              <p className="text-sm text-gray-500">Recently auto-added but not revisited</p>
            </div>
          </div>
          <span className="text-2xl font-semibold text-orange-600">{falsePositives.length}</span>
        </button>

        {expandedSection === 'false-positives' && (
          <div className="border-t border-gray-200 p-6">
            {falsePositives.length === 0 ? (
              <p className="text-gray-500">No false positives found. Great job!</p>
            ) : (
              <>
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => selectAll(falsePositives.map(b => b.id))}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Select All
                  </button>
                  {selectedBookmarks.size > 0 && (
                    <>
                      <button
                        onClick={() => handleBulkArchive(Array.from(selectedBookmarks))}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Archive Selected ({selectedBookmarks.size})
                      </button>
                      <button
                        onClick={() => handleBulkDelete(Array.from(selectedBookmarks))}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Selected ({selectedBookmarks.size})
                      </button>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  {falsePositives.map(bookmark => (
                    <div key={bookmark.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={selectedBookmarks.has(bookmark.id)}
                        onChange={() => toggleBookmark(bookmark.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bookmark.title}</p>
                        <p className="text-xs text-gray-500 truncate">{bookmark.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Added: {new Date(bookmark.dateAdded).toLocaleDateString()} • Category: {bookmark.category || 'uncategorized'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Fading Favorites Section */}
      <div className="bg-white shadow rounded-lg">
        <button
          onClick={() => toggleSection('fading')}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedSection === 'fading' ? 'transform rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">🟡 Fading Favorites</h3>
              <p className="text-sm text-gray-500">Previously active, now going stale</p>
            </div>
          </div>
          <span className="text-2xl font-semibold text-yellow-600">{fadingFavorites.length}</span>
        </button>

        {expandedSection === 'fading' && (
          <div className="border-t border-gray-200 p-6">
            {fadingFavorites.length === 0 ? (
              <p className="text-gray-500">All your favorites are still active!</p>
            ) : (
              <>
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => selectAll(fadingFavorites.map(b => b.id))}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Select All
                  </button>
                  {selectedBookmarks.size > 0 && (
                    <>
                      <button
                        onClick={() => handleBulkArchive(Array.from(selectedBookmarks))}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Archive Selected ({selectedBookmarks.size})
                      </button>
                      <button
                        onClick={() => handleBulkDelete(Array.from(selectedBookmarks))}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Selected ({selectedBookmarks.size})
                      </button>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  {fadingFavorites.map(bookmark => (
                    <div key={bookmark.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded hover:border-blue-300">
                      <input
                        type="checkbox"
                        checked={selectedBookmarks.has(bookmark.id)}
                        onChange={() => toggleBookmark(bookmark.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bookmark.title}</p>
                        <p className="text-xs text-gray-500 truncate">{bookmark.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Visited {bookmark.visitCount}x • Last visit: {bookmark.lastVisited ? new Date(bookmark.lastVisited).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Duplicates Section */}
      <div className="bg-white shadow rounded-lg">
        <button
          onClick={() => toggleSection('duplicates')}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedSection === 'duplicates' ? 'transform rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">📋 Duplicates</h3>
              <p className="text-sm text-gray-500">Same URL bookmarked multiple times</p>
            </div>
          </div>
          <span className="text-2xl font-semibold text-purple-600">{duplicates.length} groups</span>
        </button>

        {expandedSection === 'duplicates' && (
          <div className="border-t border-gray-200 p-6">
            {duplicates.length === 0 ? (
              <p className="text-gray-500">No duplicates found. Clean!</p>
            ) : (
              <div className="space-y-4">
                {duplicates.map((group, idx) => {
                  const groupUrl = group[0].url.toLowerCase().replace(/\/$/, '');
                  const mostUsed = group.reduce((prev, current) =>
                    (current.visitCount > prev.visitCount) ? current : prev
                  );

                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">"{group[0].title}" - {group.length} copies</h4>
                      <div className="space-y-2">
                        {group.map(bookmark => (
                          <div
                            key={bookmark.id}
                            className={`flex items-center justify-between p-2 rounded ${
                              bookmark.id === mostUsed.id ? 'bg-green-50 border border-green-300' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">{bookmark.url}</p>
                              <p className="text-xs text-gray-500">
                                Visited {bookmark.visitCount}x • Added {new Date(bookmark.dateAdded).toLocaleDateString()}
                                {bookmark.id === mostUsed.id && <span className="ml-2 text-green-600 font-medium">⭐ Most Used</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => handleKeepDuplicate(groupUrl, mostUsed.id)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Keep Most Used
                        </button>
                        <button
                          onClick={() => handleBulkDelete(group.map(b => b.id))}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete All
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Archive Section */}
      <div className="bg-white shadow rounded-lg">
        <button
          onClick={() => toggleSection('archive')}
          className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${
                expandedSection === 'archive' ? 'transform rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className="text-left">
              <h3 className="text-lg font-medium text-gray-900">📦 Archive</h3>
              <p className="text-sm text-gray-500">Browse and restore archived bookmarks</p>
            </div>
          </div>
          <span className="text-2xl font-semibold text-gray-600">{archivedBookmarks.length}</span>
        </button>

        {expandedSection === 'archive' && (
          <div className="border-t border-gray-200 p-6">
            {archivedBookmarks.length === 0 ? (
              <p className="text-gray-500">No archived bookmarks.</p>
            ) : (
              <>
                <div className="space-y-2">
                  {archivedBookmarks.map(bookmark => (
                    <div key={bookmark.id} className="flex items-start justify-between p-3 border border-gray-200 rounded hover:border-blue-300">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{bookmark.title}</p>
                        <p className="text-xs text-gray-500 truncate">{bookmark.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Category: {bookmark.category || 'uncategorized'} • Visited {bookmark.visitCount}x
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleRestore(bookmark.id)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleBulkDelete([bookmark.id])}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Edit Bookmark Modal Component
interface EditBookmarkModalProps {
  bookmark: Bookmark;
  onSave: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: string) => void;
  onCancel: () => void;
}

function EditBookmarkModal({ bookmark, onSave, onDelete, onCancel }: EditBookmarkModalProps) {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);
  const [category, setCategory] = useState(bookmark.category || 'uncategorized');

  const categories = [
    'development',
    'shopping',
    'social-media',
    'news',
    'entertainment',
    'work',
    'research',
    'finance',
    'health',
    'education',
    'uncategorized'
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...bookmark,
      title,
      url,
      category
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Bookmark</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => onDelete(bookmark.id)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
              >
                Delete
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
