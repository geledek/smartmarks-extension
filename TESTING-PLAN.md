# SmartMarks User Testing Plan & Checklist

**Version:** 1.0.0
**Start Date:** 2026-01-17
**Tester:** [Your Name]
**Environment:** Chrome Version ___ | OS: ___

---

## 📋 Quick Start

This testing plan has 4 phases over 3-4 weeks:
1. **Phase 1:** Initial validation (30 minutes - today)
2. **Phase 2:** Daily use testing (1 week)
3. **Phase 3:** Stress testing (weekend)
4. **Phase 4:** Real-world usage (2-3 weeks)

---

## Phase 1: Initial Validation (30 minutes - Today)

**Goal:** Verify all core systems work

### ✅ Test 1: Bookmark Creation & Categorization

- [ ] Visit github.com → Press Ctrl+D (Cmd+D) → Save bookmark
- [ ] Visit stackoverflow.com → Bookmark it
- [ ] Visit amazon.com → Bookmark it
- [ ] Visit youtube.com → Bookmark it
- [ ] Visit reddit.com → Bookmark it

**Verify:**
- [ ] Open Dashboard (right-click extension icon → Options)
- [ ] Check "Total Bookmarks" count = 5 (or your total)
- [ ] Wait 2-3 minutes for categorization
- [ ] Check "Bookmarks by Category":
  - [ ] github.com, stackoverflow.com → Development
  - [ ] amazon.com → Shopping
  - [ ] youtube.com → Entertainment
  - [ ] reddit.com → Social Media

**Notes:**
```
Categorization worked: Yes / No
Issues found:




```

---

### ✅ Test 2: Search Functionality

Open popup (click extension icon) and try these searches:

- [ ] Search: "github" → Should find GitHub bookmark
- [ ] Search: "stack" → Should find StackOverflow
- [ ] Search: "shopping" → Should find Amazon
- [ ] Search: "video" or "tube" → Should find YouTube
- [ ] Click a search result → Should open bookmark

**Verify:**
- [ ] Search returns results instantly
- [ ] Categories display under each result
- [ ] Clicking result opens the website

**Notes:**
```
Search speed: Fast / Slow / Very slow
Issues found:




```

---

### ✅ Test 3: History Permission

- [ ] Close popup completely
- [ ] Open popup again
- [ ] **Did permission dialog appear?** Yes / No

**If Yes (first run):**
- [ ] Read the dialog carefully
- [ ] Choose one:
  - [ ] **Enable Tracking** → Click "Enable Tracking" button
  - [ ] **Skip** → Click "Skip for Now" button

**Verify Permission Status:**
- [ ] Open Dashboard → Settings tab
- [ ] Find "History Tracking" toggle
- [ ] Status shows: Enabled / Disabled

**Test Tracking:**
- [ ] If enabled: Visit a bookmarked site normally (not through popup)
- [ ] If disabled: Click a bookmark FROM the popup
- [ ] Refresh Dashboard → Check if visit was tracked

**Notes:**
```
Permission granted: Yes / No
Tracking working: Yes / No
Issues:



```

---

### ✅ Test 4: Service Worker Check

- [ ] Open `chrome://extensions` in a new tab
- [ ] Find "SmartMarks" extension card
- [ ] Click "Details" button
- [ ] Scroll down to "Inspect views"
- [ ] Click "service worker" link

**In Developer Console:**
- [ ] Look for "SmartMarks installed" message
- [ ] Look for "Starting categorization" messages
- [ ] **Are there any RED error messages?** Yes / No

**If Errors Found:**
```
Copy error messages here:





```

---

## Phase 2: Daily Use Testing (Week 1)

**Dates:** ___ to ___
**Goal:** Use naturally and observe behavior

### Daily Checklist (Do every day)

#### Day 1 (Date: _______)

**Morning:**
- [ ] Add 2-3 bookmarks from your browsing
- [ ] Try 1 search in popup
- [ ] Note categories assigned

**Evening:**
- [ ] Add 2-3 more bookmarks
- [ ] Check Dashboard stats
- [ ] Try 1-2 searches

**Daily Log:**
```
Bookmarks added today: ___
Searches performed: ___
Categories: ________________
Issues: None / See below

Issues found:



```

#### Day 2 (Date: _______)

**Morning:**
- [ ] Add 2-3 bookmarks
- [ ] Try conversational search: "that article from yesterday"
- [ ] Did it work? Yes / No

**Evening:**
- [ ] Add 2-3 more bookmarks
- [ ] Check Dashboard
- [ ] Try search: "site I bookmarked this week"

**Daily Log:**
```
Bookmarks added today: ___
Searches performed: ___
Conversational search worked: Yes / No
Issues:



```

#### Day 3 (Date: _______)

**Morning:**
- [ ] Add 2-3 bookmarks
- [ ] Test search speed (feels instant?)
- [ ] Check service worker (any errors?)

**Evening:**
- [ ] Add 2-3 bookmarks
- [ ] Dashboard check
- [ ] Total bookmarks now: ___

**Daily Log:**
```
Bookmarks added today: ___
Total bookmarks: ___
Search speed: Fast / Acceptable / Slow
Issues:



```

#### Day 4 (Date: _______)

**Tasks:**
- [ ] Add 3-5 bookmarks
- [ ] Try these searches:
  - [ ] "github repo"
  - [ ] "shopping site"
  - [ ] "news article"
- [ ] Check categorization accuracy: ____%

**Daily Log:**
```
Bookmarks added today: ___
Searches performed: ___
Categorization accurate: Yes / Mostly / No
Issues:



```

#### Day 5 (Date: _______)

**Tasks:**
- [ ] Add 3-5 bookmarks
- [ ] Open Dashboard → Review all categories
- [ ] Any miscategorized bookmarks? List below
- [ ] Test clicking bookmarks from popup (tracking works?)

**Daily Log:**
```
Bookmarks added today: ___
Miscategorized items:



Issues:



```

#### Day 6 (Date: _______)

**Tasks:**
- [ ] Add 3-5 bookmarks
- [ ] Test edge case: Bookmark same URL twice with different query params
  - [ ] URL 1: https://example.com/page?utm_source=test
  - [ ] URL 2: https://example.com/page?ref=email
- [ ] Check if detected as duplicates (Dashboard → Archive, if archiving ran)

**Daily Log:**
```
Bookmarks added today: ___
Duplicate detection working: Unknown / Yes / No
Issues:



```

#### Day 7 (Date: _______)

**Week 1 Review:**
- [ ] Total bookmarks added this week: ___
- [ ] Total searches performed: ___
- [ ] Categorization accuracy estimate: ____%
- [ ] Any crashes or data loss? Yes / No
- [ ] Memory usage check:
  - [ ] Open Chrome Task Manager (Shift+Esc)
  - [ ] Find "Extension: SmartMarks"
  - [ ] Memory: ___ MB (should be <50 MB)

**Weekly Summary:**
```
What worked well:




What didn't work:




Feature requests:




Continue to Phase 3? Yes / No / Need more time
```

---

## Phase 3: Stress Testing (Weekend)

**Date:** _____
**Goal:** Test with larger dataset and edge cases

### ✅ Test 1: Bulk Import

Choose ONE option:

**Option A: Use Real Bookmarks (Recommended)**
- [ ] Check current Chrome bookmark count (Ctrl+Shift+O)
- [ ] Count: ___ bookmarks
- [ ] SmartMarks reads these automatically
- [ ] Wait 15 minutes for batch categorization
- [ ] Check Dashboard → Total should match Chrome count
- [ ] Total matches? Yes / No

**Option B: Create Test Batch**
- [ ] Bookmark all 20 URLs from list below
- [ ] Wait 5 minutes
- [ ] Check Dashboard → All categorized correctly?

**Test URLs (Option B):**
```
Development (4):
- github.com/microsoft/vscode
- stackoverflow.com/questions
- npmjs.com
- docker.com

Shopping (3):
- amazon.com
- ebay.com
- etsy.com

News (3):
- cnn.com
- bbc.com
- nytimes.com

Social (3):
- twitter.com
- reddit.com
- linkedin.com

Entertainment (3):
- youtube.com
- netflix.com
- spotify.com

Work (3):
- slack.com
- notion.so
- trello.com

Uncategorized (2):
- example.com
- yourname.local
```

**Results:**
```
Total bookmarks after import: ___
Correctly categorized: ___ out of ___
Accuracy: ____%
Time to categorize all: ___ minutes
```

---

### ✅ Test 2: Performance Testing

**With your current bookmark count:**

- [ ] **Search Test 1:** Type "github" → Measure time
  - Time: ___ ms (instant / fast / slow)
- [ ] **Search Test 2:** Type "shopping" → Measure time
  - Time: ___ ms
- [ ] **Search Test 3:** Type full word "development" → Measure time
  - Time: ___ ms
- [ ] **Search Test 4:** Try misspelling: "githib" → Still finds GitHub?
  - Works: Yes / No

**Performance Standards:**
- Instant: <100ms ✅
- Fast: 100-300ms ✅
- Acceptable: 300-500ms ⚠️
- Slow: >500ms ❌

**Memory Check:**
- [ ] Open Chrome Task Manager (Shift+Esc)
- [ ] Find "Extension: SmartMarks"
- [ ] Memory usage: ___ MB
- [ ] Acceptable: <50 MB for <1,000 bookmarks

**Notes:**
```
Search performance: Excellent / Good / Acceptable / Poor
Memory usage: Acceptable / Too High
Issues:



```

---

### ✅ Test 3: Duplicate Detection

**Setup:**
- [ ] Bookmark: `https://example.com/page?utm_source=google&id=123`
- [ ] Bookmark: `https://www.example.com/page?utm_campaign=test&id=123`
- [ ] Bookmark: `https://example.com/page/?id=123`

**Wait 24 hours for daily archiving task to run**

**Check Results (next day):**
- [ ] Open Dashboard → Archive tab
- [ ] Look for duplicate bookmarks
- [ ] Should keep most recent, archive others
- [ ] Worked correctly? Yes / No / Didn't run yet

**Notes:**
```
Duplicates detected: Yes / No
Correct one kept: Yes / No
Issues:


```

---

### ✅ Test 4: Excluded Domains

**Test banking domain exclusion:**
- [ ] Visit a banking site: bankofamerica.com / chase.com / yourbank.com
- [ ] Create bookmark
- [ ] Check Dashboard categories
- [ ] Bank bookmark should be "Uncategorized"
- [ ] Should NOT be tracked (no visit count)

**Results:**
```
Bank bookmark categorized? Yes / No (should be No)
Bank bookmark tracked? Yes / No (should be No)
Exclusion working: Yes / No
```

---

### ✅ Test 5: Service Worker Stability

**Monitor during heavy use:**
- [ ] Open service worker console (chrome://extensions → Inspect)
- [ ] Create 10 bookmarks quickly
- [ ] Watch console for processing messages
- [ ] Look for chunked processing (batches of 100)
- [ ] Any crashes or errors? Yes / No

**If service worker crashed:**
```
Error message:



Did it recover automatically? Yes / No
Data lost? Yes / No
```

---

## Phase 4: Real-World Usage (Weeks 3-4)

**Dates:** ___ to ___
**Goal:** Validate in actual workflow

### Week 3 Goals

- [ ] Use SmartMarks exclusively (no Chrome bookmark search)
- [ ] Add 10+ bookmarks per day from normal browsing
- [ ] Search 3-5 times per day using popup
- [ ] Stop manually organizing bookmarks in folders
- [ ] Let categorization handle organization

**Week 3 Checklist:**

- [ ] **Day 1:** Used for all bookmark searches today
- [ ] **Day 2:** Found everything I needed? Yes / No
- [ ] **Day 3:** Faster than Chrome default? Yes / No
- [ ] **Day 4:** Categorization helpful? Yes / No
- [ ] **Day 5:** Any false positives in categories?
- [ ] **Day 6:** Check Archive tab for auto-archived items
- [ ] **Day 7:** Still prefer SmartMarks over default? Yes / No

**Week 3 Summary:**
```
Total bookmarks now: ___
Daily searches average: ___
Findability: Better / Same / Worse than Chrome default
Reliability: No issues / Minor issues / Major issues

Issues encountered:




```

---

### Week 4 Goals

- [ ] Continue daily use
- [ ] Test advanced conversational searches
- [ ] Review archived items (if any)
- [ ] Decide if ready for daily driver

**Advanced Search Tests:**

- [ ] "github project from last week" → Found? Yes / No
- [ ] "shopping site I visited yesterday" → Found? Yes / No
- [ ] "dev tool I bookmarked this month" → Found? Yes / No
- [ ] "stackoverflow post about react" → Found? Yes / No
- [ ] "that article I read on Tuesday" → Found? Yes / No

**Results:**
```
Advanced search success rate: ___ out of 5
Conversational search usefulness: High / Medium / Low
```

**Archive Review:**
- [ ] Open Dashboard → Archive tab
- [ ] How many bookmarks archived automatically? ___
- [ ] Review first 10 archived items
- [ ] Any false positives (shouldn't be archived)? Yes / No
- [ ] If yes, restore them

**Final Assessment:**
- [ ] **Stability:** No crashes for 3+ weeks? Yes / No
- [ ] **Accuracy:** Categorization >80% correct? Yes / No (___%)
- [ ] **Performance:** Search fast enough? Yes / No
- [ ] **Reliability:** No data loss? Yes / No
- [ ] **Usability:** Prefer over Chrome default? Yes / No

---

## 🎯 Success Criteria

Check ALL that apply after 3-4 weeks:

- [ ] ✅ **Stable:** No crashes or data loss
- [ ] ✅ **Accurate:** Categories correct >80% of time
- [ ] ✅ **Fast:** Search responds in <500ms
- [ ] ✅ **Reliable:** Works consistently every day
- [ ] ✅ **Useful:** Better than Chrome's default tools
- [ ] ✅ **Trustworthy:** Comfortable using for all bookmarks

**If 5+ criteria met:** ✅ Ready for daily driver
**If 3-4 criteria met:** ⚠️ Needs improvements
**If <3 criteria met:** ❌ Not ready yet

---

## 📊 Final Statistics

Fill out after completing all phases:

### Bookmark Statistics
- Total bookmarks tested: ___
- Date range: ___ to ___
- Categories used: ___
- Archived items: ___

### Usage Statistics
- Total searches performed: ___
- Search success rate: ___%
- Days used: ___
- Days with issues: ___

### Performance Metrics
- Average search time: ___ ms
- Peak memory usage: ___ MB
- Service worker crashes: ___
- Data loss incidents: ___

### Categorization Accuracy
- Development: ___% correct
- Shopping: ___% correct
- Social Media: ___% correct
- News: ___% correct
- Entertainment: ___% correct
- Work: ___% correct
- Other categories: ___% correct
- **Overall: ___% correct**

---

## 🐛 Issues Log

### Critical Issues (P0)
```
1. [Date] - [Description]
   Status: Open / Fixed / Won't Fix

2.

```

### High Priority Issues (P1)
```
1. [Date] - [Description]
   Status: Open / Fixed / Won't Fix

2.

```

### Medium Priority Issues (P2)
```
1. [Date] - [Description]
   Status: Open / Fixed / Won't Fix

2.

```

### Low Priority / Enhancement Requests
```
1. [Date] - [Description]

2.

```

---

## 📝 Overall Assessment

**After completing all phases, answer these questions:**

### What Worked Really Well
```




```

### What Needs Improvement
```




```

### Would You Recommend to Others?
```
Yes / No / Maybe

Reasoning:




```

### Ready for Chrome Web Store?
```
Yes / No / Not Yet

What's needed before submission:




```

### Overall Rating
```
Rate 1-10: ___/10

One sentence summary:



```

---

## ✅ Completion Status

- [ ] Phase 1: Initial Validation (30 min)
- [ ] Phase 2: Daily Use Testing (Week 1)
- [ ] Phase 3: Stress Testing (Weekend)
- [ ] Phase 4: Real-World Usage (Weeks 3-4)
- [ ] Final Assessment Complete

**Testing Completed:** _____ (date)
**Decision:** Continue Using / Needs Work / Not Ready

---

## 📞 Feedback & Support

**Found a bug?** Note it in the Issues Log above

**Have suggestions?** Add to Enhancement Requests section

**Questions?** Check the main README.md for troubleshooting

---

**Thank you for testing SmartMarks! 🎉**

Your feedback helps make this extension better for everyone.
