import { useState, useEffect } from 'react';
import { db } from '../db';
import { HistoryPermissionToggle } from './PermissionDialog';

/**
 * SmartMarks Options/Dashboard Component
 * Full dashboard with stats, archive management, and settings
 */
export function Options() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    archived: 0,
    byCategory: [] as Array<{ category: string; count: number }>
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cleanup' | 'archive' | 'settings'>('dashboard');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const allBookmarks = await db.bookmarks.toArray();
    const activeBookmarks = allBookmarks.filter(b => !b.isArchived);
    const archivedBookmarks = allBookmarks.filter(b => b.isArchived);

    // Count by category
    const categoryCounts = new Map<string, number>();
    activeBookmarks.forEach(bookmark => {
      const category = bookmark.category || 'uncategorized';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    });

    setStats({
      total: allBookmarks.length,
      active: activeBookmarks.length,
      archived: archivedBookmarks.length,
      byCategory: Array.from(categoryCounts.entries()).map(([category, count]) => ({
        category,
        count
      }))
    });
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
              Cleanup
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'archive'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Archive
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

            {/* Categories */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bookmarks by Category</h2>
              <div className="space-y-2">
                {stats.byCategory.map(({ category, count }) => (
                  <div key={category} className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cleanup' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Selective Cleanup</h2>
            <p className="text-gray-600 mb-4">
              Archive entire categories safely. You can review and restore them later from the Archive tab.
            </p>
            <div className="text-gray-500">Coming soon...</div>
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Archived Bookmarks</h2>
            <p className="text-gray-600 mb-4">
              Review, restore, or permanently delete archived bookmarks.
            </p>
            <div className="text-gray-500">Coming soon...</div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Permissions</h2>
              <HistoryPermissionToggle />
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
              <p className="text-gray-600">
                SmartMarks v1.0.0 - Local-first bookmark organization
              </p>
              <p className="text-gray-500 text-sm mt-2">
                All data stays on your device. No external servers. No tracking.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
