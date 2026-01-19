# Privacy Policy for SmartMarks

**Last Updated:** January 19, 2026

## Overview

SmartMarks is a browser extension that helps you organize bookmarks intelligently. We are committed to protecting your privacy. This policy explains what data SmartMarks accesses, how it's used, and your rights.

**Key Point: SmartMarks is 100% local-first. All your data stays on your device. We do not collect, transmit, or store any of your data on external servers.**

## Data Collection and Usage

### Data Stored Locally on Your Device

SmartMarks stores the following data in your browser's local storage (IndexedDB):

| Data Type | Purpose | Storage Location |
|-----------|---------|------------------|
| Bookmark metadata | Categorization, search, organization | Local IndexedDB |
| Visit counts | Track bookmark usage patterns | Local IndexedDB |
| Category assignments | Organize bookmarks by topic | Local IndexedDB |
| User preferences | Remember your settings | Local IndexedDB |
| Natural language rules | Custom include/exclude preferences | Local IndexedDB |

### Browsing History Access (Optional)

If you grant the optional "history" permission, SmartMarks accesses your browsing history to:

- **Detect frequently visited sites** - Identify URLs you visit often (2+ times/week, 3+ times/month, or 5+ times/quarter)
- **Auto-create bookmarks** - Automatically bookmark sites that meet visit thresholds
- **Track visit patterns** - Update bookmark visit counts for better organization

**Important:**
- Browsing history data is processed entirely on your device
- No browsing history is ever transmitted to external servers
- You can revoke this permission at any time in Settings
- SmartMarks works without this permission (manual mode only)

### Data We Do NOT Collect

SmartMarks does **NOT**:

- Send any data to external servers
- Track your browsing activity beyond what you explicitly permit
- Collect personal information (name, email, etc.)
- Use analytics or tracking services
- Share data with third parties
- Store data in the cloud
- Access page content or form data

## Permissions Explained

| Permission | Why We Need It |
|------------|----------------|
| `bookmarks` | Core functionality - read and create bookmarks in Chrome |
| `storage` | Save your settings and bookmark metadata locally |
| `alarms` | Schedule background tasks (categorization, auto-archive) |
| `tabs` | Group open tabs by bookmark category |
| `tabGroups` | Create and style Chrome tab groups |
| `history` (optional) | Detect frequently visited sites for auto-bookmarking |

## Data Retention

- All data is stored locally in your browser
- Data persists until you uninstall the extension or clear browser data
- You can delete all SmartMarks data by uninstalling the extension
- Archived bookmarks can be permanently deleted through the Cleanup tab

## Your Rights and Controls

You have full control over your data:

1. **Revoke History Permission** - Go to Settings > Permissions to disable history tracking
2. **Disable Auto-Bookmarking** - Turn off automatic bookmark creation in Settings
3. **Delete Data** - Uninstall the extension to remove all stored data
4. **Export Data** - Use "Export to Chrome Folders" to organize bookmarks in Chrome's native structure

## Data Security

- All data processing occurs locally in your browser
- No network requests are made to external servers
- Data is stored using Chrome's secure storage APIs
- No encryption keys or sensitive credentials are stored

## Children's Privacy

SmartMarks does not knowingly collect any personal information from children under 13 years of age.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date above. Continued use of SmartMarks after changes constitutes acceptance of the updated policy.

## Open Source

SmartMarks is open source. You can review our code to verify these privacy practices:
- GitHub: [https://github.com/geledek/smartmarks-extension](https://github.com/geledek/smartmarks-extension)

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository.

---

**Summary:** SmartMarks is a privacy-focused, local-first extension. Your bookmarks and browsing data never leave your device. We don't track you, we don't collect analytics, and we don't share anything with anyone.
