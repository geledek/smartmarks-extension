# Promotional Images for Chrome Web Store

## Required Images

### 1. Small Promotional Image (REQUIRED)
- **Size:** 440 x 280 pixels
- **Format:** PNG or JPEG
- **Used in:** Search results, category listings

### 2. Extension Icon (REQUIRED)
- **Size:** 128 x 128 pixels (96x96 content with 16px padding)
- **Format:** PNG
- **Status:** Already exists in `/public/icons/icon-128.png`

## Optional Images (Recommended)

### 3. Large Promotional Image
- **Size:** 920 x 680 pixels
- **Format:** PNG or JPEG
- **Used in:** Category page listings

### 4. Marquee Promotional Image
- **Size:** 1400 x 560 pixels
- **Format:** PNG or JPEG
- **Used in:** Featured sections, editor's picks, homepage banners
- **Note:** Required if you want to be featured

---

## Design Guidelines

### Do's
- Use saturated, vibrant colors
- Fill the entire image area
- Make it work at 50% size (thumbnails)
- Show the extension's value proposition visually
- Use your brand colors consistently

### Don'ts
- Avoid excessive text (hard to read at small sizes)
- Don't use white/light gray backgrounds (blends with store)
- Don't leave undefined edges
- Don't include screenshots in promo images (use screenshot slots for that)

---

## Suggested Design Concept for SmartMarks

### Theme: "Order from Chaos"

**Visual Concept:**
- Left side: Scattered, messy bookmark icons/tabs (chaos)
- Right side: Neatly organized, color-coded groups (order)
- SmartMarks logo/icon in the center as the "transformation"
- Gradient background in brand colors (blue to purple)

**Color Palette:**
```
Primary Blue:    #3B82F6
Purple:          #8B5CF6
Green (success): #10B981
Background:      #1E293B (dark) or gradient
Text:            #FFFFFF
```

**Text (minimal):**
- "SmartMarks" (logo)
- Optional tagline: "Auto-organize your bookmarks"

---

## HTML Template for Small Promo Image

You can open this HTML file in a browser, take a screenshot at 440x280, or use it as a design reference.

See: `promo-image-template.html` in this folder.

---

## Quick Creation Options

### Option 1: Use Figma/Canva (Recommended)
1. Create new design at 440x280
2. Use the design concept above
3. Export as PNG

### Option 2: Use the HTML Template
1. Open `promo-image-template.html` in Chrome
2. Use Chrome DevTools to set viewport to 440x280
3. Take screenshot (Cmd+Shift+P > "Capture screenshot")

### Option 3: AI Image Generation
Use Midjourney/DALL-E with prompt:
```
Minimal promotional banner for a bookmark organizer browser extension called "SmartMarks". Show transformation from chaotic scattered bookmarks to organized color-coded groups. Modern, clean design with blue and purple gradient. No text. 440x280 pixels.
```

---

## File Checklist

```
□ small-promo-440x280.png    (REQUIRED)
□ large-promo-920x680.png    (Recommended)
□ marquee-1400x560.png       (For featuring)
```

Save final images in `/docs/store-assets/` folder.
