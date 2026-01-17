# SmartMarks - Quick Start Testing Guide

**🚀 Get started testing in 5 minutes**

---

## Right Now (5 minutes)

### 1. Create Test Bookmarks

Open these sites and bookmark them (Ctrl+D / Cmd+D):

```
✅ github.com          → Should categorize: Development
✅ stackoverflow.com   → Should categorize: Development
✅ amazon.com          → Should categorize: Shopping
✅ youtube.com         → Should categorize: Entertainment
✅ reddit.com          → Should categorize: Social Media
```

**Done?** ✅

---

### 2. Check Categorization

Wait **2 minutes**, then:

1. Right-click SmartMarks icon → **Options**
2. Look at "Bookmarks by Category"
3. Do you see the categories above? ☐ Yes ☐ No

**If No:** Wait 5 more minutes (batch processing runs every 15 min)

---

### 3. Try Search

Click the SmartMarks icon, then search:

```
Search: "github"     → Found? ☐ Yes ☐ No
Search: "shopping"   → Found? ☐ Yes ☐ No
Search: "video"      → Found? ☐ Yes ☐ No
```

**All found?** ✅

---

### 4. Grant Permission (Optional)

If you see a permission dialog:
- **Enable Tracking**: For full smart archiving features
- **Skip for Now**: Still works, just tracks popup clicks only

**Your choice:** ☐ Enabled ☐ Skipped

---

## ✅ Basic Test Complete!

If all 4 steps worked: **SmartMarks is working correctly!** 🎉

---

## Today (30 minutes)

### Quick Verification Checklist

- [ ] **Test 1:** Create 5 bookmarks → All categorized correctly?
- [ ] **Test 2:** Search works → Results appear instantly?
- [ ] **Test 3:** Dashboard shows stats → Numbers look right?
- [ ] **Test 4:** No errors in console → Check service worker

**Chrome service worker check:**
1. Open `chrome://extensions`
2. SmartMarks → Details → "Inspect views: service worker"
3. Look for errors (red text) → None? ✅

---

## This Week (Natural Usage)

### Your Only Job: Use It Normally

**Every day:**
1. Bookmark 3-5 interesting sites you find
2. Use popup to search 2-3 times
3. Check Dashboard once

**That's it!** No special tests, just natural usage.

---

## Track This (Optional)

Keep a simple note:

```
Day 1: Added 5 bookmarks, searched 3 times. Working great! ✅
Day 2: Added 4 bookmarks, search fast. One miscategorization.
Day 3: ...
```

Or just note issues when you see them.

---

## 🚨 Stop Testing If...

**Red Flags (report immediately):**
- ❌ Extension crashes Chrome
- ❌ Bookmarks disappear
- ❌ Can't find any bookmarks via search
- ❌ Service worker constantly crashing

**These are serious - stop and report!**

---

## 📖 Full Details

- **Complete Testing Plan:** See `TESTING-PLAN.md`
- **Quick Checklist:** See `TESTING-CHECKLIST.md`
- **User Guide:** See `README.md`

---

## 🎯 Success = Just Working

After 1 week, ask yourself:

> "Do I prefer using SmartMarks over Chrome's default bookmark tools?"

**Yes?** ✅ It's working!
**No?** Note why and keep testing (or report issues)

---

## Questions?

**Not finding bookmarks?**
- Wait 15 minutes for initial categorization
- Check Dashboard → Total count

**Search not working?**
- Try simpler queries: just "github" or "amazon"
- Check if bookmarks exist in Dashboard

**Categories wrong?**
- Note which ones (expected vs actual)
- Include in weekly feedback

**Something broke?**
- Check service worker console for errors
- Note what you were doing when it broke

---

**That's it! Just use it normally and see how it goes. 🚀**

Most important: Does it make finding your bookmarks easier?
