# Changelog

All notable changes to SmartMarks will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-17

### Added

- **Cleanup & Archive Tab** - Comprehensive curation dashboard for reviewing AI decisions
  - **False Positives Section** - Identify recently auto-added bookmarks that haven't been revisited
  - **Fading Favorites Section** - Find previously active bookmarks with declining usage
  - **Duplicates Section** - Detect and merge duplicate bookmarks with smart grouping
  - **Archive Section** - Browse, restore, or permanently delete archived bookmarks

- **Bulk Actions** - Select multiple bookmarks and perform actions
  - Archive multiple bookmarks at once
  - Delete multiple bookmarks permanently
  - Select all functionality for quick cleanup

- **Smart Duplicate Detection** - Automatically groups duplicate URLs
  - Highlights most-used bookmark in each group
  - One-click "Keep Most Used" action
  - Shows visit count and date added for informed decisions

- **Expandable Sections** - Collapsible UI for clean interface
  - Each section shows summary count when collapsed
  - Click to expand and view details
  - Maintains context while browsing

### Changed

- Merged separate "Cleanup" and "Archive" tabs into unified "Cleanup & Archive" tab
- Improved false positive detection logic for better accuracy
- Enhanced duplicate detection with URL normalization

### Documentation

- Added Product Model & Vision section to `.claude/claude.md`
- Documented behavior-driven curation workflow
- Clarified SmartMarks as intelligent favorites curator (not traditional bookmark manager)

## [1.0.0] - 2026-01-17

### Added

- Initial release of SmartMarks
- Auto-categorization of bookmarks (Development, Shopping, Entertainment, etc.)
- Conversational search with Fuse.js fuzzy matching
- Smart archiving based on usage patterns
- Dashboard with bookmark statistics
- Category-based organization
- Local-first architecture (100% private, no cloud sync)
- History permission integration for visit tracking
- Export to Chrome bookmark folders
- Settings and permissions management

### Features

- **Auto-Categorization**
  - Detects bookmark categories based on URL patterns
  - 11 default categories with icons and colors
  - Real-time categorization on bookmark creation

- **Smart Search**
  - Search by title, URL, category, or tags
  - Fuzzy matching for typo tolerance
  - Instant results in popup

- **Auto-Archiving**
  - Automatic archiving of unused bookmarks (90-day threshold)
  - Daily background processing
  - Resumable jobs for reliability

- **Dashboard**
  - Total, active, and archived bookmark counts
  - Expandable category view with bookmark lists
  - Edit/delete individual bookmarks
  - Export to Chrome folder structure

[1.1.0]: https://github.com/yourusername/smartmarks-extension/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/smartmarks-extension/releases/tag/v1.0.0
