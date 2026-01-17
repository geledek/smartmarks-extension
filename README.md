# SmartMarks - Intelligent Bookmark Organizer

**Version:** 1.0.0
**Status:** Personal Use Ready

SmartMarks is a 100% local-first Chrome extension for personal bookmark organization. It uses rule-based categorization, conversational fuzzy search, and smart archiving to keep your bookmarks organized without sending any data to external servers.

---

## ✨ Features

### 🔒 Privacy-First
- **100% Local Processing** - All data stays on your device
- **No External Servers** - Zero network requests to third parties
- **Optional History Tracking** - You control what permissions to grant
- **No Telemetry** - No analytics, no tracking, no ads

### 📂 Smart Organization
- **Automatic Categorization** - 62+ known domains (GitHub, Stack Overflow, Amazon, etc.)
- **11 Categories** - Development, Shopping, Social Media, News, Entertainment, Work, Research, Finance, Health, Education, Uncategorized
- **Smart Archiving** - Automatically archive inactive bookmarks and duplicates
- **Duplicate Detection** - Intelligent URL normalization removes tracking parameters

### 🔍 Powerful Search
- **Conversational Search** - "that flower website I saw last week"
- **Fuzzy Matching** - Find bookmarks even with typos
- **Category Filtering** - Search within specific categories
- **Temporal Queries** - "yesterday", "last week", "this month"

### ⚡ Performance
- **MV3 Compatible** - Uses Chrome Manifest V3 with service workers
- **Checkpoint-Based Processing** - Handles 10,000+ bookmarks efficiently
- **Chunked Operations** - Process bookmarks in batches of 100
- **Resumable Jobs** - Background tasks survive service worker termination

---

## 📦 Installation

### Prerequisites
- Chrome/Edge/Brave browser (Manifest V3 compatible)
- Node.js 18+ (for building from source)

### Load Unpacked Extension (Development)

1. **Clone and Build:**
   ```bash
   cd smartmarks-extension
   npm install
   npm run build
   ```

2. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `dist` folder from the project directory

3. **Verify Installation:**
   - You should see the SmartMarks icon in your extensions toolbar
   - Click the icon to open the popup search interface

---

## 🚀 Quick Start Guide

### First Run: Permission Setup

When you first open SmartMarks, you'll see a permission dialog:

**History Tracking (Optional)**
- **Enable:** SmartMarks tracks which bookmarks you visit for smart archiving
- **Decline:** Only tracks visits when you click bookmarks through the extension popup
- **Privacy:** All tracking is local - no data leaves your device

You can change this permission later in Settings.

### Using the Popup (Quick Search)

Click the SmartMarks icon to open the popup:

1. **Search Bookmarks:**
   ```
   Type: "github repo"
   Type: "that shopping site"
   Type: "article from last week"
   ```
   Results appear instantly with fuzzy matching

2. **Recently Visited:**
   - When not searching, see your 5 most recently visited bookmarks
   - Click any bookmark to open it

3. **Open Dashboard:**
   - Click "Open Dashboard" button at the bottom
   - Access full features: stats, archive, cleanup, settings

### Using the Dashboard

Right-click the extension icon → **Options** (or click "Open Dashboard" in popup)

#### Dashboard Tab
- **Statistics Cards:** Total, Active, and Archived bookmark counts
- **Category Breakdown:** See how many bookmarks are in each category

#### Settings Tab
- **History Permission Toggle:** Enable/disable visit tracking
- **About:** Extension version and privacy statement

---

## 🎯 How To Use

### Automatic Categorization

SmartMarks automatically categorizes new bookmarks:

1. **Save a bookmark** (Ctrl+D) to any known domain
2. **Wait a few seconds** for instant categorization
3. **Or wait 15 minutes** for batch processing of uncategorized bookmarks

**Supported Domains:** 62+ including:
- Development: github.com, stackoverflow.com, npmjs.com
- Shopping: amazon.com, ebay.com, etsy.com
- Social: facebook.com, twitter.com, reddit.com
- News: cnn.com, bbc.com, nytimes.com
- And many more...

### Conversational Search Examples

```
"that flower website I saw last week"
→ Temporal: last 7 days, Content: "flower", "website"

"github repo from yesterday"
→ Temporal: yesterday, Category: Development, Content: "repo"

"shopping sites this month"
→ Temporal: past 30 days, Category: Shopping

"stackoverflow thread about react"
→ Category: Development, Content: "stackoverflow", "react"
```

### Smart Archiving

SmartMarks automatically archives bookmarks when:

1. **Inactive for 90+ days** (default, configurable)
   - Not visited within threshold
   - Pinned bookmarks never archived

2. **Duplicates detected**
   - Same URL with different tracking parameters
   - Keeps most recently visited

**Archive runs daily** via background task.

### URL Normalization Examples

SmartMarks detects these as duplicates:

```
https://www.example.com/page?utm_source=google&id=123
https://example.com/page?id=123&utm_campaign=email
→ Normalized: https://example.com/page?id=123
```

**Removed Parameters:**
- Google Analytics: utm_*, _ga, _gid
- Facebook: fbclid, fb_*
- Google Ads: gclid, dclid
- Microsoft: msclkid
- Others: ref, source, campaign

---

## 🔧 Configuration

### Settings (Dashboard → Settings Tab)

1. **History Permission**
   - Toggle on/off anytime
   - See current status
   - Understand what it does

2. **Auto-Archive Threshold** (Coming Soon)
   - Configure: 30, 60, 90, or 180 days
   - Default: 90 days

3. **Excluded Domains** (Coming Soon)
   - Add custom domains to never track
   - Default excludes: banks, healthcare, government

### Keyboard Shortcuts (Coming Soon)

```
Ctrl+K (Windows/Linux) or Cmd+K (Mac)
→ Open SmartMarks popup

Ctrl+Shift+K
→ Open Dashboard
```

---

## 📊 Categories

SmartMarks uses 11 predefined categories:

| Category | Icon | Example Domains |
|----------|------|-----------------|
| 💻 Development | Code | github.com, stackoverflow.com, npmjs.com |
| 🛒 Shopping | Cart | amazon.com, ebay.com, etsy.com |
| 💬 Social Media | Chat | facebook.com, twitter.com, reddit.com |
| 📰 News | Newspaper | cnn.com, bbc.com, nytimes.com |
| 🎬 Entertainment | Film | youtube.com, netflix.com, spotify.com |
| 💼 Work | Briefcase | slack.com, notion.so, trello.com |
| 🔬 Research | Microscope | scholar.google.com, arxiv.org |
| 💰 Finance | Money | paypal.com, stripe.com, robinhood.com |
| 🏥 Health | Medical | webmd.com, mayoclinic.org, healthline.com |
| 📚 Education | Book | coursera.org, udemy.com, khanacademy.org |
| 📁 Uncategorized | Folder | Everything else |

---

## 🔐 Privacy & Security

### Data Storage

**All Data Stays Local:**
- **Storage:** Browser's IndexedDB (`SmartMarksDB`)
- **No Cloud:** Everything on your device
- **No Network:** Except bookmark page fetches (like visiting the page)

**What's Stored:**
- Bookmark URL, title, category, tags
- Visit count, last visited (if permission granted)
- Archive status, metadata
- Settings

### Permissions

**Required:**
- `bookmarks` - Read/write bookmark tree
- `storage` - Store data in IndexedDB
- `alarms` - Schedule background tasks

**Optional (Your Choice):**
- `history` - Track bookmark visits
  - Default: Disabled
  - Fallback: Tracks clicks in popup only

**Never Requested:**
- ❌ `<all_urls>` - No access to all websites
- ❌ `tabs` - No tab access
- ❌ Content scripts - No code injection

### Excluded Domains

Never tracked or categorized:
- **Banking:** bankofamerica.com, chase.com, wells fargo.com
- **Healthcare:** myhealthrecord.com, webmd.com
- **Government:** irs.gov, ssa.gov, dmv.gov

---

## 🛠️ Development

### Project Structure

```
smartmarks-extension/
├── src/
│   ├── components/          # React UI components
│   │   ├── Popup.tsx        # Search interface
│   │   ├── Options.tsx      # Dashboard
│   │   └── PermissionDialog.tsx
│   ├── hooks/
│   │   └── useFirstRun.ts
│   ├── background.ts        # Service worker (MV3)
│   ├── db.ts               # IndexedDB (Dexie)
│   ├── categorization.ts   # Categorization engine
│   ├── search.ts           # Search engine
│   ├── metadata.ts         # Metadata extraction
│   ├── checkpoints.ts      # Resumable jobs
│   ├── utils.ts
│   └── manifest.json
├── public/icons/
├── dist/                   # Build output
└── README.md
```

### Build Commands

```bash
# Install dependencies
npm install

# Production build
npm run build

# Development with watch
npm run dev

# Type checking
tsc -b
```

### Tech Stack

- **Frontend:** React 19, TypeScript 5.7
- **Styling:** Tailwind CSS 4.1
- **Build:** Vite 7.2, @crxjs/vite-plugin
- **Storage:** IndexedDB with Dexie.js 4.2
- **Search:** Fuse.js 7.1
- **Extension:** Chrome Manifest V3

---

## 🐛 Troubleshooting

### Extension Won't Load

**Problem:** Error when loading extension

**Solution:**
1. Run `npm run build` first
2. Load the `dist` folder (not root)
3. Use Chrome 88+ (Manifest V3)

### Bookmarks Not Categorizing

**Problem:** All show "Uncategorized"

**Solution:**
1. Wait 15 minutes for batch categorization
2. Check if domain is in supported list
3. Create bookmark on github.com to test

### Search Returns Nothing

**Problem:** No search results

**Solution:**
1. Check bookmarks exist (Dashboard → Total count)
2. Try simple query: just domain or keyword
3. Verify bookmarks aren't archived

### History Permission Not Working

**Problem:** "Tracking disabled" message

**Solution:**
1. Dashboard → Settings → Toggle "History Tracking"
2. Grant permission when prompted
3. Reload extension if needed

---

## 🗺️ Roadmap

### Current (v1.0.0) ✅
- Local-first architecture
- Automatic categorization (62+ domains)
- Conversational search
- Smart archiving
- Optional history tracking
- MV3 compatible

### Coming Soon
- Complete Archive tab (restore, delete)
- Selective Cleanup (archive categories)
- Export/Import (JSON, HTML, CSV)
- Custom categories
- Dark mode
- Keyboard shortcuts

### Future
- Chrome Web Store submission
- On-device AI (semantic search)
- Browser compatibility (Firefox, Safari)
- Advanced analytics
- Smart suggestions
- Bookmark collections

---

## ❓ FAQ

**Q: Does SmartMarks send my data anywhere?**
A: No. 100% local processing. No servers involved.

**Q: Can I use this on Firefox?**
A: Not yet. Chrome/Edge/Brave only. Firefox support planned.

**Q: What if I uninstall?**
A: SmartMarks data deleted. Your Chrome bookmarks stay.

**Q: How to backup bookmarks?**
A: Chrome's export (Ctrl+Shift+O → Export) or SmartMarks export (coming soon).

**Q: Can I customize categories?**
A: Not yet. Custom categories planned.

**Q: Does it sync across devices?**
A: Reads from Chrome bookmarks (which sync). SmartMarks data is local-only.

**Q: Performance impact?**
A: Minimal. Chunked processing, runs in background periodically.

---

## 📄 License

**SmartMarks Personal Use License**

This extension is for personal use. All processing happens locally.

**What You Can Do:**
- Use for personal bookmark organization
- Export your data anytime
- Modify settings
- Share with friends

**What It Does:**
- Stores data locally (IndexedDB)
- Never sends data to servers
- Never tracks activity
- Never shows ads

**Your Responsibility:**
- Back up bookmarks regularly
- Understand archiving/deletion is your responsibility
- Review archived items before deletion

**No Warranty:**
- Provided "as-is"
- Developer not liable for data loss
- Back up your bookmarks!

**Privacy:**
- Data stays on device
- Optional history = local tracking only
- No telemetry, analytics, or data collection

---

## 📞 Support

**Issues:** Report bugs or request features
**Privacy:** Review source code anytime
**Security:** Open to audits

---

## 📝 Changelog

### v1.0.0 (2026-01-16)

**Initial Release:**
- Local-first architecture
- Rule-based categorization (62+ domains)
- Conversational fuzzy search
- Smart archiving (inactive + duplicates)
- Optional history tracking
- Checkpoint-based MV3 processing
- URL normalization
- Fetch-based metadata extraction
- React UI (popup + dashboard)
- Privacy-preserving (no servers)

---

**Built with ❤️ for personal use. Your bookmarks, your device, your privacy.**
