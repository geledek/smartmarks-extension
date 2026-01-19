# Screenshot Guide for Chrome Web Store

## Requirements

- **Size:** 1280 x 800 pixels (preferred) or 640 x 400 pixels
- **Format:** PNG or JPEG
- **Quantity:** 1-5 screenshots (use all 5 for best results)
- **Quality:** Clear, not blurry or pixelated

## Screenshot Checklist

### Screenshot 1: Popup - Quick Search (REQUIRED)
**File:** `screenshot-1-popup.png`

**What to show:**
- The popup open with search results displayed
- A search query like "github" with matching results
- Recent bookmarks visible below
- "Group Tabs" and "Dashboard" buttons in footer

**Setup steps:**
1. Add some test bookmarks (GitHub, Stack Overflow, Amazon, etc.)
2. Open the popup
3. Type a search query
4. Capture at 1280x800 (zoom browser if needed, or capture and scale)

**Annotation suggestions:**
- Arrow pointing to search bar: "Instant search"
- Arrow pointing to results: "Smart categorization"

---

### Screenshot 2: Dashboard - Category Overview
**File:** `screenshot-2-dashboard.png`

**What to show:**
- Full dashboard with stats cards (Total, Active, Archived)
- "Group Open Tabs" and "Export to Chrome Folders" buttons
- Expandable category list with bookmark counts
- At least 3-4 categories expanded showing bookmarks

**Setup steps:**
1. Ensure you have bookmarks in multiple categories
2. Open the Options/Dashboard page
3. Expand a few categories to show bookmarks
4. Capture the full dashboard view

**Annotation suggestions:**
- Highlight the stats cards
- Point to "Group Open Tabs" button

---

### Screenshot 3: Tab Grouping Feature
**File:** `screenshot-3-tab-groups.png`

**What to show:**
- Chrome window with tabs organized into color-coded groups
- Groups labeled by category (Dev, Work, Shop, etc.)
- Mix of grouped and ungrouped tabs for contrast

**Setup steps:**
1. Open multiple tabs from different categories
2. Click "Group Tabs" button
3. Capture Chrome window showing the grouped tabs

**Annotation suggestions:**
- "One-click tab organization"
- Point to the color-coded group labels

---

### Screenshot 4: Cleanup & Archive Tab
**File:** `screenshot-4-cleanup.png`

**What to show:**
- Cleanup tab with all 4 sections visible:
  - False Positives
  - Fading Favorites
  - Duplicates
  - Archive
- At least one section expanded with bookmarks
- Bulk action buttons (Select All, Archive, Delete)

**Setup steps:**
1. Navigate to Cleanup & Archive tab
2. Expand one or two sections
3. Show some bookmarks with checkboxes

**Annotation suggestions:**
- "Curate AI decisions"
- "Bulk actions"

---

### Screenshot 5: Settings - Natural Language Preferences
**File:** `screenshot-5-settings.png`

**What to show:**
- Settings tab with:
  - Auto-Bookmarking toggle (ON)
  - Visit threshold cards (2/week, 3/month, 5/quarter)
  - Natural language preferences textarea with example text
  - Interpreted rules showing parsed output
- History analysis section if permission granted

**Setup steps:**
1. Navigate to Settings tab
2. Enable auto-bookmarking
3. Enter example preferences:
   ```
   Keep all my work stuff
   Ignore news sites
   Always save github.com
   Don't track shopping except amazon.com
   ```
4. Click "Preview Rules" to show interpreted rules

**Annotation suggestions:**
- "Describe preferences in plain English"
- Point to the interpreted rules

---

## Capture Instructions

### Method 1: Chrome DevTools (Recommended)
1. Open the page you want to capture
2. Open DevTools (F12 or Cmd+Option+I)
3. Click the device toolbar icon (or Cmd+Shift+M)
4. Set dimensions to 1280 x 800
5. Press Cmd+Shift+P and type "Capture full size screenshot"

### Method 2: macOS Screenshot
1. Press Cmd+Shift+4
2. Press Space to capture window
3. Click the window
4. Resize in Preview if needed

### Method 3: Browser Extension
Use a screenshot extension like "GoFullPage" or "Awesome Screenshot"

---

## Post-Processing

### Recommended edits:
1. **Add annotations** - Use arrows, highlights, or callout boxes
2. **Add device frame** - Optional, makes it look more polished
3. **Ensure consistent style** - Same annotation colors, fonts across all screenshots
4. **Check file size** - Keep under 2MB per image

### Tools:
- **Figma** - Best for annotations and frames
- **Canva** - Easy annotations
- **Preview (macOS)** - Basic annotations
- **Cleanshot X** - Screenshot + annotation tool

---

## File Organization

Save all screenshots in `/docs/store-assets/`:

```
docs/
└── store-assets/
    ├── screenshot-1-popup.png
    ├── screenshot-2-dashboard.png
    ├── screenshot-3-tab-groups.png
    ├── screenshot-4-cleanup.png
    ├── screenshot-5-settings.png
    ├── small-promo-440x280.png
    ├── large-promo-920x680.png (optional)
    └── marquee-1400x560.png (optional)
```

---

## Quality Checklist

Before uploading, verify each screenshot:

- [ ] Correct dimensions (1280x800 or 640x400)
- [ ] No personal/sensitive data visible
- [ ] UI is not cut off or cropped awkwardly
- [ ] Text is readable at thumbnail size
- [ ] Represents current version features
- [ ] Consistent styling across all screenshots
