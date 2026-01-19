# Chrome Web Store Submission Checklist

## Pre-Submission Checklist

### Account Setup
- [ ] Register Chrome Web Store Developer Account ($5 one-time fee)
  - Go to: https://chrome.google.com/webstore/devconsole
- [ ] Enable 2-Step Verification on your Google account
- [ ] Verify contact email is correct

### Build Package
- [ ] Run `npm run build` to generate latest dist/
- [ ] Create ZIP file of the `dist/` folder:
  ```bash
  cd dist && zip -r ../smartmarks-extension.zip . && cd ..
  ```
- [ ] Verify ZIP is under 2GB (yours is ~400KB)

### Required Assets

| Asset | Status | File |
|-------|--------|------|
| Extension ZIP | [ ] | `smartmarks-extension.zip` |
| Small Promo Image (440x280) | [ ] | `docs/store-assets/small-promo-440x280.png` |
| Screenshot 1 - Popup | [ ] | `docs/store-assets/screenshot-1-popup.png` |
| Screenshot 2 - Dashboard | [ ] | `docs/store-assets/screenshot-2-dashboard.png` |
| Screenshot 3 - Tab Groups | [ ] | `docs/store-assets/screenshot-3-tab-groups.png` |
| Screenshot 4 - Cleanup | [ ] | `docs/store-assets/screenshot-4-cleanup.png` |
| Screenshot 5 - Settings | [ ] | `docs/store-assets/screenshot-5-settings.png` |

### Content Ready

| Content | Status | Source |
|---------|--------|--------|
| Short Description (132 chars) | [x] | `docs/STORE_LISTING.md` |
| Detailed Description | [x] | `docs/STORE_LISTING.md` |
| Privacy Policy | [x] | `docs/PRIVACY_POLICY.md` |
| Permission Justifications | [x] | `docs/STORE_LISTING.md` |
| Single Purpose Statement | [x] | `docs/STORE_LISTING.md` |

---

## Step-by-Step Submission Guide

### Step 1: Create Developer Account
1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 registration fee
3. Accept Developer Agreement

### Step 2: Create New Item
1. Click "New Item" in Developer Console
2. Upload `smartmarks-extension.zip`
3. Wait for upload to process

### Step 3: Fill Store Listing Tab

**Product Details:**
- Name: `SmartMarks - Intelligent Bookmark Organizer`
- Summary: Copy from `docs/STORE_LISTING.md` (Short Description)
- Description: Copy from `docs/STORE_LISTING.md` (Detailed Description)
- Category: `Productivity`
- Language: `English`

**Graphic Assets:**
- Upload small promo image (440x280)
- Upload 3-5 screenshots (1280x800)

### Step 4: Fill Privacy Tab

**Single Purpose:**
Copy from `docs/STORE_LISTING.md` (Single Purpose Description)

**Permission Justifications:**
Copy each permission justification from `docs/STORE_LISTING.md`

**Privacy Policy:**
- URL: `https://github.com/geledek/smartmarks-extension/blob/main/docs/PRIVACY_POLICY.md`
- Or host on your own domain

**Data Usage:**
- [ ] Check "This extension does not collect or use user data"
  - Note: SmartMarks stores data LOCALLY only, not collected by developer

### Step 5: Distribution Tab

**Visibility:**
- [x] Public
- [ ] Unlisted (for testing)

**Geographic Distribution:**
- [x] All regions (recommended)

### Step 6: Submit for Review

1. Click "Submit for Review"
2. Wait 1-3 business days for review
3. You'll receive email when approved or if changes needed

---

## After Approval

### Immediate Actions
- [ ] Share the store listing URL
- [ ] Add store badge to GitHub README
- [ ] Announce on social media/Product Hunt

### Store Badge for README
```markdown
[![Available in the Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](YOUR_STORE_URL)
```

---

## Quick Reference

### Developer Console
https://chrome.google.com/webstore/devconsole

### Documentation
- Store Listing: `docs/STORE_LISTING.md`
- Privacy Policy: `docs/PRIVACY_POLICY.md`
- Screenshots Guide: `docs/SCREENSHOTS.md`
- Promo Images Guide: `docs/PROMOTIONAL_IMAGES.md`
- Promo Template: `docs/promo-image-template.html`

### Build Commands
```bash
# Build extension
npm run build

# Create ZIP for upload
cd dist && zip -r ../smartmarks-extension.zip . && cd ..
```

### Support URLs
- GitHub Issues: https://github.com/geledek/smartmarks-extension/issues
- Privacy Policy: https://github.com/geledek/smartmarks-extension/blob/main/docs/PRIVACY_POLICY.md

---

## Estimated Timeline

| Task | Time |
|------|------|
| Create promo image | 30 min |
| Take screenshots | 30 min |
| Fill out store listing | 30 min |
| Review process | 1-3 days |
| **Total to submission** | **~1.5 hours** |
