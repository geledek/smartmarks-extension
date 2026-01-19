# Chrome Web Store Launch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare SmartMarks extension for Chrome Web Store publication

**Architecture:** Create all required Chrome Web Store assets (privacy policy, store listing copy, screenshots, promotional images), verify extension compliance, and prepare submission package.

**Tech Stack:**
- Existing: Vite, React, TypeScript, Manifest V3
- New: Markdown (privacy policy), Image assets (screenshots/promos)

**Current Status:**
- ✅ Extension built and working (v1.1.0)
- ✅ Manifest V3 compliant
- ✅ Icons created (16, 32, 48, 128px)
- ❌ Store listing assets missing
- ❌ Privacy policy missing
- ❌ Store description not optimized

---

## Phase 1: Legal & Compliance (Start Here)

### Task 1: Create Privacy Policy

**Files:**
- Create: `docs/PRIVACY-POLICY.md`
- Create: `public/privacy-policy.html`

**Step 1: Write privacy policy markdown**

Create a clear, simple privacy policy explaining local-first architecture.

**Step 2: Create HTML version for web hosting**

Convert markdown to simple HTML page (needed for Chrome Web Store submission).

**Step 3: Verify policy covers all permissions**

Check manifest.json permissions and ensure each is explained:
- `bookmarks` - Required for bookmark management
- `storage` - Local data storage
- `alarms` - Background archiving tasks
- `history` (optional) - Auto-discovery feature
- `unlimitedStorage` (optional) - Large bookmark collections

**Step 4: Commit**

```bash
git add docs/PRIVACY-POLICY.md public/privacy-policy.html
git commit -m "docs: add privacy policy for Chrome Web Store submission"
```

---

### Task 2: Create Store Listing Copy

**Files:**
- Create: `docs/store-listing/description.md`
- Create: `docs/store-listing/summary.txt` (132 char limit)

**Step 1: Write compelling 132-character summary**

Example:
```
AI-powered favorites that auto-discover & organize sites you visit. 100% local, privacy-first, no manual work.
```

Requirements:
- Max 132 characters (strict Chrome Web Store limit)
- Highlight unique value (auto-discovery, local-first)
- Action-oriented language

**Step 2: Write full store description**

Format:
```markdown
## Overview
[One compelling paragraph about what SmartMarks does differently]

## Key Features
- 🔒 **100% Local & Private** - Your data never leaves your device
- 🤖 **Auto-Discovery** - Automatically bookmark sites you visit frequently
- 📂 **Smart Categories** - AI categorization across 11 categories
- 🔍 **Conversational Search** - Find bookmarks with natural language
- 📦 **Auto-Archive** - Keeps your bookmarks clean and relevant

## How It Works
[3-4 sentences explaining the workflow from CLAUDE.md]

## Perfect For
- Productivity enthusiasts managing hundreds of bookmarks
- Developers juggling documentation and tools
- Researchers organizing articles and resources
- Anyone tired of manual bookmark management

## Privacy Commitment
[2-3 sentences about local-first, no tracking, no servers]
```

**Step 3: Verify description follows Chrome Web Store guidelines**

Check:
- [ ] Concise and informative (not just one sentence)
- [ ] No excessive keywords or spam
- [ ] Accurately describes functionality
- [ ] Highlights unique value proposition

**Step 4: Commit**

```bash
git add docs/store-listing/
git commit -m "docs: add Chrome Web Store listing copy"
```

---

## Phase 2: Visual Assets (Screenshots & Promos)

### Task 3: Plan Screenshot Strategy

**Files:**
- Create: `docs/store-listing/screenshot-plan.md`

**Step 1: Define 5 required screenshots**

Chrome Web Store requires 1-5 screenshots. Plan all 5:

1. **Main Dashboard** - Show categorized bookmarks with icons
2. **Auto-Discovery** - Highlight behavior-based bookmarking
3. **Cleanup & Archive** - Show false positives and fading favorites
4. **Conversational Search** - Demo natural language queries
5. **Privacy Settings** - Show local-first controls

**Step 2: Document screenshot specifications**

Requirements from Chrome Web Store:
- Dimensions: 1280x800 or 640x400 (16:10 ratio)
- Format: PNG or JPEG
- Max file size: 2MB each
- No padding/borders (Chrome adds automatically)

**Step 3: Create screenshot capture checklist**

For each screenshot:
- [ ] Prepare extension with sample data
- [ ] Set browser window to 1280x800
- [ ] Capture clean screenshot (no personal data)
- [ ] Add optional annotations (arrows, highlights)
- [ ] Export as PNG
- [ ] Verify file size < 2MB

**Step 4: Commit**

```bash
git add docs/store-listing/screenshot-plan.md
git commit -m "docs: add screenshot capture plan"
```

---

### Task 4: Prepare Extension for Screenshots

**Files:**
- Create: `scripts/seed-demo-data.js`

**Step 1: Create demo data seeding script**

Generate realistic bookmark data for screenshots:

```javascript
// scripts/seed-demo-data.js
const bookmarks = [
  { url: 'https://github.com/facebook/react', title: 'React', category: 'Development' },
  { url: 'https://stackoverflow.com/questions/tagged/javascript', title: 'JavaScript Questions', category: 'Development' },
  { url: 'https://www.amazon.com/dp/B08N5WRWNW', title: 'Laptop Stand', category: 'Shopping' },
  // ... 20-30 realistic bookmarks across categories
];

// Instructions to manually import into extension
console.log('Copy these bookmarks into SmartMarks...');
console.log(JSON.stringify(bookmarks, null, 2));
```

**Step 2: Add package.json script**

```json
{
  "scripts": {
    "demo": "node scripts/seed-demo-data.js"
  }
}
```

**Step 3: Run and verify demo data**

```bash
npm run demo
```

Expected output: JSON array of demo bookmarks

**Step 4: Document manual import process**

Add to `docs/store-listing/screenshot-plan.md`:
```markdown
## Demo Data Setup
1. Run `npm run demo`
2. Load extension in Chrome
3. Manually add bookmarks or import via Chrome's bookmark manager
4. Verify categories are assigned correctly
```

**Step 5: Commit**

```bash
git add scripts/seed-demo-data.js package.json docs/store-listing/screenshot-plan.md
git commit -m "chore: add demo data script for screenshots"
```

---

### Task 5: Capture Screenshots

**Files:**
- Create: `assets/store-listing/screenshots/1-main-dashboard.png`
- Create: `assets/store-listing/screenshots/2-auto-discovery.png`
- Create: `assets/store-listing/screenshots/3-cleanup-archive.png`
- Create: `assets/store-listing/screenshots/4-conversational-search.png`
- Create: `assets/store-listing/screenshots/5-privacy-settings.png`

**Step 1: Set up browser for screenshots**

```bash
# Open Chrome with extension loaded
# Set window size to 1280x800
# Load demo data
```

**Step 2: Capture screenshot 1 - Main Dashboard**

- Open extension popup showing categorized bookmarks
- Ensure multiple categories visible (Development, Shopping, etc.)
- Take screenshot (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)
- Save as `assets/store-listing/screenshots/1-main-dashboard.png`

**Step 3: Capture screenshot 2 - Auto-Discovery**

- Show the extension highlighting frequently visited sites
- Display category auto-assignment in action
- Save as `assets/store-listing/screenshots/2-auto-discovery.png`

**Step 4: Capture screenshot 3 - Cleanup & Archive**

- Navigate to Cleanup & Archive tab
- Show false positives and fading favorites
- Save as `assets/store-listing/screenshots/3-cleanup-archive.png`

**Step 5: Capture screenshot 4 - Conversational Search**

- Type natural language query like "that flower website last week"
- Show search results
- Save as `assets/store-listing/screenshots/4-conversational-search.png`

**Step 6: Capture screenshot 5 - Privacy Settings**

- Open options page
- Show local-first messaging and permission controls
- Save as `assets/store-listing/screenshots/5-privacy-settings.png`

**Step 7: Verify all screenshots**

Check each file:
- [ ] 1280x800 or 640x400 dimensions
- [ ] PNG format
- [ ] < 2MB file size
- [ ] No personal information visible
- [ ] Clear and professional appearance

**Step 8: Commit**

```bash
git add assets/store-listing/screenshots/
git commit -m "assets: add Chrome Web Store screenshots"
```

---

### Task 6: Create Promotional Images

**Files:**
- Create: `assets/store-listing/promo-tile-440x280.png`
- Create: `assets/store-listing/promo-marquee-1400x560.png`

**Step 1: Design promotional tile (440x280)**

Small tile shown in Chrome Web Store search results.

Requirements:
- Dimensions: 440x280 pixels
- Format: PNG or JPEG
- Content: Extension icon + "SmartMarks" text + tagline
- Style: Clean, professional, matches extension colors

Recommended tools:
- Figma (free)
- Canva (free)
- Photoshop/GIMP

**Step 2: Design marquee promotional image (1400x560)**

Large banner shown on extension detail page.

Requirements:
- Dimensions: 1400x560 pixels
- Format: PNG or JPEG
- Content: Extension showcase with key features
- Style: Visually appealing, shows UI preview

**Step 3: Export images**

- Export tile as `assets/store-listing/promo-tile-440x280.png`
- Export marquee as `assets/store-listing/promo-marquee-1400x560.png`
- Verify file sizes < 2MB

**Step 4: Commit**

```bash
git add assets/store-listing/promo-*.png
git commit -m "assets: add promotional images for Chrome Web Store"
```

---

## Phase 3: Pre-Submission Testing

### Task 7: Build and Test Extension

**Files:**
- Modify: `package.json` (verify version)
- Modify: `src/manifest.json` (verify version matches)

**Step 1: Verify version numbers match**

Check that `package.json` and `src/manifest.json` both show `1.1.0`.

```bash
grep '"version"' package.json src/manifest.json
```

Expected output:
```
package.json:  "version": "1.1.0",
src/manifest.json:  "version": "1.1.0",
```

**Step 2: Run production build**

```bash
npm run build
```

Expected output: Build succeeds without errors, `dist/` directory created.

**Step 3: Verify dist/manifest.json**

```bash
cat dist/manifest.json | grep '"version"'
```

Expected output: `"version": "1.1.0"`

**Step 4: Test extension in clean browser profile**

```bash
# 1. Open Chrome
# 2. Create new profile for testing
# 3. Go to chrome://extensions
# 4. Enable Developer Mode
# 5. Click "Load unpacked"
# 6. Select dist/ directory
# 7. Test core functionality
```

Test checklist:
- [ ] Extension loads without errors
- [ ] Popup opens and shows UI
- [ ] Can create bookmark
- [ ] Category assignment works
- [ ] Search functionality works
- [ ] Options page loads
- [ ] No console errors

**Step 5: Run automated tests**

```bash
npm run test
```

Expected output: All tests pass.

**Step 6: Commit any fixes**

If bugs found, fix them and commit:

```bash
git add src/
git commit -m "fix: resolve issues found in pre-submission testing"
npm run build
```

---

### Task 8: Create Submission Checklist

**Files:**
- Create: `docs/chrome-web-store-checklist.md`

**Step 1: Write comprehensive submission checklist**

```markdown
# Chrome Web Store Submission Checklist

## Required Files
- [ ] `dist/manifest.json` (v1.1.0, Manifest V3)
- [ ] Icons: 16x16, 32x32, 48x48, 128x128
- [ ] Privacy policy (hosted URL required)
- [ ] Store listing description (132 char summary + full description)
- [ ] Screenshots (5 images, 1280x800)
- [ ] Promotional tile (440x280)
- [ ] Marquee image (1400x560)

## Technical Verification
- [ ] Extension builds without errors (`npm run build`)
- [ ] All tests pass (`npm run test`)
- [ ] Extension loads in clean Chrome profile
- [ ] No console errors in background/popup
- [ ] Permissions are minimal and justified
- [ ] Content Security Policy is strict

## Listing Quality
- [ ] Summary is compelling and < 132 characters
- [ ] Description follows best practices (paragraph + bullets)
- [ ] Screenshots are high-quality and demonstrate features
- [ ] Promotional images are professional
- [ ] Privacy policy is accessible and clear

## Legal & Policy
- [ ] Privacy policy URL ready (need to host somewhere)
- [ ] No misleading functionality claims
- [ ] No keyword stuffing
- [ ] Complies with Chrome Web Store policies

## Post-Submission
- [ ] Support email configured
- [ ] Ready to respond to reviews within 1-3 weeks
- [ ] Plan for handling user feedback
```

**Step 2: Commit checklist**

```bash
git add docs/chrome-web-store-checklist.md
git commit -m "docs: add submission checklist"
```

---

## Phase 4: Hosting Privacy Policy

### Task 9: Host Privacy Policy (Required for Submission)

**Files:**
- Modify: `public/privacy-policy.html`
- Create: `docs/hosting-options.md`

**Step 1: Document hosting options**

Chrome Web Store requires a publicly accessible URL for privacy policy.

Options:
1. **GitHub Pages** (Free, easiest)
   - Create `gh-pages` branch
   - Enable GitHub Pages in repo settings
   - Access at `https://yourusername.github.io/smartmarks-extension/privacy-policy.html`

2. **Cloudflare Pages** (Free, fast)
   - Connect GitHub repo
   - Deploy `public/` directory
   - Access at custom domain or cloudflare.pages.dev

3. **Netlify** (Free, auto-deploy)
   - Connect GitHub repo
   - Deploy `public/` directory
   - Access at custom domain or netlify.app

**Step 2: Choose hosting solution**

Recommendation: GitHub Pages (simplest for first-time publishers)

**Step 3: Set up GitHub Pages**

If using GitHub Pages:

```bash
# Create orphan gh-pages branch
git checkout --orphan gh-pages

# Add only privacy policy
git reset
git add public/privacy-policy.html
git commit -m "docs: publish privacy policy for Chrome Web Store"

# Push to GitHub
git push origin gh-pages

# Switch back to main branch
git checkout main
```

Then enable GitHub Pages in repository settings.

**Step 4: Verify privacy policy URL**

Visit: `https://yourusername.github.io/smartmarks-extension/privacy-policy.html`

Expected: Privacy policy displays correctly.

**Step 5: Update manifest with privacy policy URL**

```bash
# Add to src/manifest.json if needed for documentation
# (Not required in manifest, but good practice)
```

**Step 6: Document the URL**

Add to `docs/chrome-web-store-checklist.md`:

```markdown
## Privacy Policy URL
- Live URL: https://yourusername.github.io/smartmarks-extension/privacy-policy.html
- Last Updated: 2026-01-17
```

**Step 7: Commit**

```bash
git add docs/chrome-web-store-checklist.md
git commit -m "docs: add privacy policy URL to checklist"
```

---

## Phase 5: Chrome Web Store Submission

### Task 10: Prepare Submission Package

**Files:**
- Create: `dist.zip` (extension package)
- Create: `docs/submission-guide.md`

**Step 1: Create ZIP of dist directory**

```bash
cd dist
zip -r ../smartmarks-extension-v1.1.0.zip .
cd ..
```

Expected output: `smartmarks-extension-v1.1.0.zip` created (< 20MB)

**Step 2: Verify ZIP contents**

```bash
unzip -l smartmarks-extension-v1.1.0.zip | head -20
```

Expected: Contains manifest.json, HTML files, JS files, icons, etc.

**Step 3: Write submission guide**

Create `docs/submission-guide.md`:

```markdown
# Chrome Web Store Submission Guide

## Prerequisites
- [ ] Google account with Chrome Web Store Developer access
- [ ] One-time $5 developer registration fee (if first extension)
- [ ] All assets ready (see chrome-web-store-checklist.md)

## Submission Steps

### 1. Register as Chrome Web Store Developer
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Accept Developer Agreement
3. Pay $5 one-time registration fee
4. Verify email

### 2. Create New Item
1. Click "New Item"
2. Upload `smartmarks-extension-v1.1.0.zip`
3. Wait for upload to complete

### 3. Fill Store Listing
- **Product Details:**
  - Name: SmartMarks - Intelligent Bookmark Organizer
  - Summary: [paste from docs/store-listing/summary.txt]
  - Description: [paste from docs/store-listing/description.md]
  - Category: Productivity
  - Language: English

- **Graphic Assets:**
  - Icon: Already in ZIP (128x128)
  - Screenshots: Upload all 5 from assets/store-listing/screenshots/
  - Promotional tile: Upload 440x280 image
  - Marquee: Upload 1400x560 image

- **Privacy & Legal:**
  - Privacy Policy: [paste hosted URL]
  - Permissions Justification: Explain why each permission is needed
  - Single Purpose: "Organize and search browser bookmarks intelligently"

### 4. Submit for Review
1. Review all fields
2. Click "Submit for Review"
3. Wait 1-3 weeks for review

### 5. Post-Submission
- Monitor dashboard for review status
- Respond to any reviewer questions within 48 hours
- Once approved, extension goes live automatically

## Common Rejection Reasons
- Privacy policy not accessible
- Misleading screenshots or description
- Excessive permissions without justification
- Manifest V2 (must be V3)
- Security vulnerabilities

## Review Timeline
- Typical: 1-3 weeks
- Complex extensions: 2-4 weeks
- Resubmissions: 3-5 days
```

**Step 4: Commit**

```bash
git add docs/submission-guide.md
git commit -m "docs: add Chrome Web Store submission guide"
```

---

## Phase 6: What I Can Start Now

### Task 11: Privacy Policy (Can Start Immediately)

I can write the privacy policy now since I understand the extension architecture from the codebase.

**Action:** Create privacy policy based on manifest permissions and local-first design.

---

### Task 12: Store Listing Copy (Can Start Immediately)

I can write compelling store listing copy based on the CLAUDE.md product model.

**Action:** Create summary and full description optimized for Chrome Web Store.

---

## What You Need to Do

### User Tasks (Cannot be automated)

1. **Screenshots** - Requires running extension and capturing screens
2. **Promotional images** - Requires design skills (or I can guide you)
3. **Choose hosting** - GitHub Pages, Cloudflare, or Netlify
4. **Submit to Chrome Web Store** - Requires your Google account
5. **Pay $5 registration fee** - One-time Chrome Web Store developer fee

---

## Summary Timeline

| Phase | Tasks | Time Estimate | Can Claude Do? |
|-------|-------|---------------|----------------|
| 1. Legal & Compliance | Privacy policy, store copy | 30 min | ✅ Yes |
| 2. Visual Assets | Screenshots, promo images | 2-3 hours | ❌ No (user) |
| 3. Testing | Build, test, verify | 1 hour | ✅ Yes (guided) |
| 4. Hosting | Privacy policy URL | 30 min | ⚠️ Partially |
| 5. Submission | Upload, fill forms | 1 hour | ❌ No (user) |

**Total Active Time:** 5-6 hours
**Total Calendar Time:** 1-3 weeks (includes review)

---

## Execution Notes

- **Start with Phase 1** - Legal compliance is required
- **Screenshots require manual work** - Plan for dedicated time
- **Privacy policy must be hosted** - Decide on hosting early
- **Keep version at 1.1.0** - Don't increment until submission
- **Test thoroughly** - First submissions get more scrutiny

---

## Next Steps

**If you want me to start immediately:**
1. I'll create the privacy policy (Task 1)
2. I'll create the store listing copy (Task 2)
3. I'll create the demo data script (Task 4)
4. You'll handle screenshots and design

**If you want to review the plan first:**
- Ask questions about any unclear tasks
- Decide on hosting solution for privacy policy
- Choose whether you'll create promo images or want design guidance
