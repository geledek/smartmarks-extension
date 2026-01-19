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
  // v1.2.0: Auto-bookmarking settings
  naturalLanguagePreferences?: string;
  historyAnalyzedAt?: number;
  weeklyVisitThreshold: number;    // default: 2
  monthlyVisitThreshold: number;   // default: 3
  quarterlyVisitThreshold: number; // default: 5
  autoBookmarkEnabled: boolean;    // default: true
}

// v1.2.0: Track URLs that might become bookmarks
export interface CandidateUrl {
  id?: number;
  url: string;
  normalizedUrl: string;  // URL without tracking params
  title: string;
  domain: string;
  firstSeen: number;
  lastSeen: number;
  visitCount: number;
  weeklyVisits: number;
  monthlyVisits: number;
  quarterlyVisits: number;
  status: 'tracking' | 'promoted' | 'dismissed' | 'excluded';
}

// v1.2.0: Natural language rules parsed from user preferences
export interface NaturalLanguageRule {
  id?: number;
  rawText: string;
  type: 'include' | 'exclude';
  conditions: {
    domains?: string[];
    keywords?: string[];
    categories?: string[];
  };
  priority: number;
  isActive: boolean;
}

export interface ProcessingCheckpoint {
  id?: number;
  jobType: 'categorize' | 'archive' | 'metadata' | 'historyAnalysis' | 'candidateRecalculation';
  startTime: number;
  lastProcessedId?: string;
  totalItems: number;
  processedCount: number;
  status: 'running' | 'completed' | 'failed';
  // v1.2.0: Additional data for history analysis
  lastProcessedIndex?: number;
  urlStats?: unknown; // Store serialized stats for resume
}

// Database class
export class SmartMarksDB extends Dexie {
  bookmarks!: Table<Bookmark, string>;
  categories!: Table<Category, string>;
  visitHistory!: Table<VisitHistory, number>;
  settings!: Table<Settings, string>;
  checkpoints!: Table<ProcessingCheckpoint, number>;
  candidateUrls!: Table<CandidateUrl, number>;
  naturalLanguageRules!: Table<NaturalLanguageRule, number>;

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

    // Version 3: Add auto-bookmarking tables
    this.version(3).stores({
      bookmarks: 'id, url, category, lastVisited, isPinned, isArchived',
      categories: 'id, name',
      visitHistory: '++id, bookmarkId, timestamp',
      settings: 'userId',
      checkpoints: '++id, jobType, status',
      candidateUrls: '++id, url, normalizedUrl, domain, status',
      naturalLanguageRules: '++id, type, isActive'
    }).upgrade(tx => {
      // Migrate existing settings to include new fields
      return tx.table('settings').toCollection().modify(settings => {
        settings.weeklyVisitThreshold = settings.weeklyVisitThreshold ?? 2;
        settings.monthlyVisitThreshold = settings.monthlyVisitThreshold ?? 3;
        settings.quarterlyVisitThreshold = settings.quarterlyVisitThreshold ?? 5;
        settings.autoBookmarkEnabled = settings.autoBookmarkEnabled ?? true;
      });
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
      // v1.2.0: Auto-bookmarking defaults
      weeklyVisitThreshold: 2,
      monthlyVisitThreshold: 3,
      quarterlyVisitThreshold: 5,
      autoBookmarkEnabled: true,
    };

    await this.settings.add(defaultSettings);
  }
}

// Export singleton instance
export const db = new SmartMarksDB();
