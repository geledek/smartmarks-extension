import Dexie, { type Table } from 'dexie';

// Database models
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  category?: string;
  tags: string[];
  dateAdded: number;
  lastVisited?: number;
  visitCount: number;
  isPinned: boolean;
  isArchived: boolean;
  metadata: {
    description?: string;
    favicon?: string;
    contentHash: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  bookmarkCount: number;
}

export interface VisitHistory {
  id?: number;
  bookmarkId: string;
  timestamp: number;
  duration: number;
}

export interface Settings {
  userId?: string;
  isPremium: boolean;
  updateFrequency: 'realtime' | 'daily' | 'weekly';
  excludedDomains: string[];
  archiveThreshold: number;
  autoArchive: boolean;
  enableAI: boolean;
}

export interface ProcessingCheckpoint {
  id?: number;
  jobType: 'categorize' | 'archive' | 'metadata';
  startTime: number;
  lastProcessedId?: string;
  totalItems: number;
  processedCount: number;
  status: 'running' | 'completed' | 'failed';
}

// Database class
export class SmartMarksDB extends Dexie {
  bookmarks!: Table<Bookmark, string>;
  categories!: Table<Category, string>;
  visitHistory!: Table<VisitHistory, number>;
  settings!: Table<Settings, string>;
  checkpoints!: Table<ProcessingCheckpoint, number>;

  constructor() {
    super('SmartMarksDB');

    this.version(1).stores({
      bookmarks: 'id, url, category, lastVisited, isPinned, isArchived',
      categories: 'id, name',
      visitHistory: '++id, bookmarkId, timestamp',
      settings: 'userId'
    });

    // Version 2: Add checkpoints table for MV3 resumable processing
    this.version(2).stores({
      bookmarks: 'id, url, category, lastVisited, isPinned, isArchived',
      categories: 'id, name',
      visitHistory: '++id, bookmarkId, timestamp',
      settings: 'userId',
      checkpoints: '++id, jobType, status'
    });
  }

  // Initialize default data
  async initialize() {
    const categoryCount = await this.categories.count();
    if (categoryCount === 0) {
      await this.addDefaultCategories();
    }

    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.addDefaultSettings();
    }
  }

  private async addDefaultCategories() {
    const defaultCategories: Category[] = [
      { id: 'development', name: 'Development', icon: '💻', color: '#3b82f6', isDefault: true, bookmarkCount: 0 },
      { id: 'shopping', name: 'Shopping', icon: '🛒', color: '#10b981', isDefault: true, bookmarkCount: 0 },
      { id: 'social', name: 'Social Media', icon: '💬', color: '#8b5cf6', isDefault: true, bookmarkCount: 0 },
      { id: 'news', name: 'News', icon: '📰', color: '#ef4444', isDefault: true, bookmarkCount: 0 },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#f59e0b', isDefault: true, bookmarkCount: 0 },
      { id: 'work', name: 'Work', icon: '💼', color: '#6366f1', isDefault: true, bookmarkCount: 0 },
      { id: 'research', name: 'Research', icon: '🔬', color: '#ec4899', isDefault: true, bookmarkCount: 0 },
      { id: 'finance', name: 'Finance', icon: '💰', color: '#14b8a6', isDefault: true, bookmarkCount: 0 },
      { id: 'health', name: 'Health', icon: '🏥', color: '#f43f5e', isDefault: true, bookmarkCount: 0 },
      { id: 'education', name: 'Education', icon: '📚', color: '#06b6d4', isDefault: true, bookmarkCount: 0 },
      { id: 'uncategorized', name: 'Uncategorized', icon: '📁', color: '#6b7280', isDefault: true, bookmarkCount: 0 },
    ];

    await this.categories.bulkAdd(defaultCategories);
  }

  private async addDefaultSettings() {
    const defaultSettings: Settings = {
      userId: 'local',
      isPremium: false,
      updateFrequency: 'realtime',
      excludedDomains: [
        // Banking
        'bankofamerica.com', 'chase.com', 'wellsfargo.com', 'citibank.com',
        // Healthcare
        'myhealthrecord.com', 'webmd.com', 'medlineplus.gov',
        // Government
        'irs.gov', 'ssa.gov', 'dmv.gov',
      ],
      archiveThreshold: 90, // days
      autoArchive: true,
      enableAI: false,
    };

    await this.settings.add(defaultSettings);
  }
}

// Export singleton instance
export const db = new SmartMarksDB();
