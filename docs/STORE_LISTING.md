# Chrome Web Store Listing for SmartMarks

## Basic Information

**Extension Name:** SmartMarks - Intelligent Bookmark Organizer

**Short Description (132 characters max):**
```
Auto-organize bookmarks from your browsing habits. Local-first, privacy-focused. No cloud, no tracking, just smart organization.
```

**Category:** Productivity

**Language:** English

---

## Detailed Description

```
SmartMarks is an intelligent bookmark curator that organizes your favorites based on how you actually browse - not manual bookmarking.

THE PROBLEM
Traditional bookmark managers require you to manually save and organize every site. Result? Hundreds of unsorted bookmarks you never use, or important sites you forgot to save.

THE SOLUTION
SmartMarks watches your browsing patterns and automatically:
- Creates bookmarks for sites you visit frequently
- Organizes them into smart categories (Work, Shopping, Development, etc.)
- Archives bookmarks you stop using
- Identifies duplicates and false positives

HOW IT WORKS
1. Browse normally - no manual bookmarking needed
2. SmartMarks detects patterns (2 visits/week, 3/month, or 5/quarter)
3. Frequently visited sites become bookmarks automatically
4. AI categorizes them by content (Development, Shopping, News, etc.)
5. Unused bookmarks get archived after 90 days

KEY FEATURES

Auto-Bookmarking
- Analyzes your browsing history to find important sites
- Creates bookmarks when visit thresholds are met
- Tracks candidates until they qualify

Smart Categorization
- 10+ built-in categories (Development, Shopping, Social, News, etc.)
- Rule-based categorization by domain and keywords
- Automatic category assignment with confidence scores

One-Click Tab Grouping
- Groups all open tabs by bookmark category
- Uses Chrome's native tab groups
- Color-coded for easy navigation

Natural Language Preferences
- Tell SmartMarks what to keep or ignore in plain English
- "Keep all my work stuff"
- "Ignore news sites except techcrunch.com"
- "Always save github.com"

Cleanup & Curation Dashboard
- False Positives: Recently added but never revisited
- Fading Favorites: Active bookmarks going stale
- Duplicates: Same URL bookmarked multiple times
- Archive: Browse, restore, or permanently delete

PRIVACY FIRST
- 100% local - all data stays on YOUR device
- No cloud sync, no external servers
- No tracking, no analytics
- Open source - verify our code yourself
- Works offline

PERMISSIONS EXPLAINED
- Bookmarks: Core functionality
- Storage: Save settings locally
- Tabs/TabGroups: Group tabs by category
- History (optional): Detect frequently visited sites

Perfect for:
- Developers with hundreds of documentation tabs
- Researchers collecting resources
- Anyone drowning in unsorted bookmarks
- Privacy-conscious users who want local-first tools

SmartMarks doesn't just manage bookmarks - it curates them based on what actually matters to you.

---
Version 1.2.0
Open Source: github.com/geledek/smartmarks-extension
```

---

## Single Purpose Description

**For the Developer Console "Single Purpose" field:**

```
SmartMarks automatically creates and organizes bookmarks based on browsing patterns. It monitors which sites you visit frequently, auto-bookmarks them when thresholds are met, categorizes them by content type, and archives unused bookmarks - all processed locally on your device.
```

---

## Permission Justifications

**For the Developer Console privacy fields:**

### bookmarks
```
Required to read existing Chrome bookmarks, create new bookmarks from frequently visited sites, update bookmark metadata, and organize bookmarks into the SmartMarks system. This is the core functionality of the extension.
```

### storage
```
Required to store user preferences, bookmark metadata (categories, visit counts, tags), and application state in the browser's local storage. All data remains on the user's device.
```

### alarms
```
Required to schedule periodic background tasks: automatic categorization of new bookmarks (every 15 minutes), archiving of inactive bookmarks (daily), and recalculation of visit statistics (hourly).
```

### tabs
```
Required for the "Group Tabs" feature, which organizes open browser tabs into Chrome tab groups based on their bookmark categories. The extension reads tab URLs to match them with bookmarked categories.
```

### tabGroups
```
Required to create, update, and style Chrome tab groups when the user clicks "Group Tabs". This includes setting group titles, colors, and collapsed state based on bookmark categories.
```

### history (optional)
```
Optional permission that enables automatic bookmark creation. When granted, SmartMarks analyzes browsing history to identify frequently visited sites (2+ visits/week, 3+/month, or 5+/quarter) and automatically creates bookmarks for them. All processing is done locally - no history data is transmitted externally. The extension works without this permission in manual-only mode.
```

---

## Keywords/Tags

```
bookmarks, bookmark manager, bookmark organizer, auto bookmark, tab groups, productivity, local-first, privacy, offline, categorize, organize tabs
```

---

## Support Information

**Support URL:** https://github.com/geledek/smartmarks-extension/issues

**Privacy Policy URL:** https://github.com/geledek/smartmarks-extension/blob/main/docs/PRIVACY_POLICY.md

---

## Version Notes (for Updates)

### v1.2.0
- NEW: Auto-bookmarking from browsing history
- NEW: One-click tab grouping by category
- NEW: Natural language preferences ("Keep work stuff", "Ignore news")
- NEW: Candidate URL tracking for potential bookmarks
- Database schema v3 with new tables
