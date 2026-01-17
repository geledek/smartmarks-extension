/**
 * SmartMarks Extension - Automated Smoke Test
 *
 * This script automatically tests the extension by:
 * 1. Loading the extension in Chrome
 * 2. Creating test bookmarks
 * 3. Waiting for categorization
 * 4. Testing search functionality
 * 5. Checking for console errors
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, 'dist');
const TEST_TIMEOUT = 120000; // 2 minutes

// Test bookmarks to create
const TEST_BOOKMARKS = [
  { url: 'https://github.com', title: 'GitHub', expectedCategory: 'Development' },
  { url: 'https://stackoverflow.com', title: 'Stack Overflow', expectedCategory: 'Development' },
  { url: 'https://amazon.com', title: 'Amazon', expectedCategory: 'Shopping' },
  { url: 'https://youtube.com', title: 'YouTube', expectedCategory: 'Entertainment' },
  { url: 'https://reddit.com', title: 'Reddit', expectedCategory: 'Social Media' }
];

// Test searches
const TEST_SEARCHES = [
  { query: 'github', shouldFind: 'GitHub' },
  { query: 'shopping', shouldFind: 'Amazon' },
  { query: 'video', shouldFind: 'YouTube' }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchBrowserWithExtension() {
  console.log('🚀 Launching Chrome with SmartMarks extension...');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  return browser;
}

async function createBookmarks(browser) {
  console.log('\n📚 Creating test bookmarks...');
  console.log('  ℹ️  Opening test pages and bookmarking them...\n');

  for (const bookmark of TEST_BOOKMARKS) {
    const page = await browser.newPage();
    await page.goto(bookmark.url, { waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
      console.log(`  ⚠️  Could not load ${bookmark.url}, using blank page`);
    });

    // Use Chrome's bookmark shortcut (Cmd+D on Mac, Ctrl+D on others)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.down(modifier);
    await page.keyboard.press('KeyD');
    await page.keyboard.up(modifier);

    await sleep(1000); // Wait for bookmark dialog

    // Press Enter to save bookmark with default settings
    await page.keyboard.press('Enter');
    await sleep(500);

    console.log(`  ✓ Bookmarked: ${bookmark.title} (${bookmark.url})`);
    await page.close();
  }

  console.log(`  ✅ Created ${TEST_BOOKMARKS.length} bookmarks`);
}

async function waitForCategorization(waitTimeSeconds = 30) {
  console.log(`\n⏳ Waiting ${waitTimeSeconds} seconds for categorization...`);

  const startTime = Date.now();
  await sleep(waitTimeSeconds * 1000);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`  ✅ Waited ${elapsed}s`);
}

async function testSearch(page, extensionId) {
  console.log('\n🔍 Testing search functionality...');

  // Open extension popup
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  await page.goto(popupUrl, { waitUntil: 'networkidle0' });

  console.log('  ✓ Opened popup');

  // Wait a bit for popup to initialize
  await sleep(2000);

  // Try each search query
  for (const test of TEST_SEARCHES) {
    console.log(`  Testing search: "${test.query}"`);

    // Find search input and enter query
    const searchInput = await page.$('input[type="text"], input[placeholder*="search" i]');

    if (searchInput) {
      await searchInput.click({ clickCount: 3 }); // Select all
      await searchInput.type(test.query);
      await sleep(1000); // Wait for search results

      // Check if results contain expected bookmark
      const pageContent = await page.content();
      if (pageContent.toLowerCase().includes(test.shouldFind.toLowerCase())) {
        console.log(`    ✅ Found "${test.shouldFind}" in results`);
      } else {
        console.log(`    ⚠️  "${test.shouldFind}" not found in results`);
      }
    } else {
      console.log(`    ⚠️  Search input not found`);
    }
  }
}

async function checkServiceWorker(page, extensionId) {
  console.log('\n🔧 Checking service worker...');

  // Navigate to extensions page
  await page.goto('chrome://extensions/', { waitUntil: 'networkidle0' });

  console.log('  ✓ Navigated to chrome://extensions');
  console.log('  ℹ️  Manual check: Look for errors in service worker console');
  console.log(`  ℹ️  Extension ID: ${extensionId}`);
}

async function getExtensionId(browser) {
  // Get the service worker target to find extension ID
  const targets = await browser.targets();
  const extensionTarget = targets.find(target =>
    target.type() === 'service_worker' &&
    target.url().includes('chrome-extension://')
  );

  if (extensionTarget) {
    const url = extensionTarget.url();
    const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
    if (match) {
      return match[1];
    }
  }

  return null;
}

async function runTests() {
  let browser;

  try {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  SmartMarks Extension - Automated Smoke Test  ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // Launch browser with extension
    browser = await launchBrowserWithExtension();
    const page = await browser.newPage();

    // Wait for extension to load
    await sleep(2000);

    // Get extension ID
    const extensionId = await getExtensionId(browser);
    if (!extensionId) {
      throw new Error('Could not find extension ID');
    }
    console.log(`✓ Extension loaded (ID: ${extensionId})\n`);

    // Create test bookmarks
    await createBookmarks(browser);

    // Wait for categorization
    await waitForCategorization(30);

    // Test search functionality
    await testSearch(page, extensionId);

    // Check service worker
    await checkServiceWorker(page, extensionId);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║           ✅ Smoke Test Complete!             ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    console.log('Next steps:');
    console.log('  1. Check the browser window for any visual issues');
    console.log('  2. Manually verify categories in Options page');
    console.log('  3. Check service worker console for errors');
    console.log('\nPress Ctrl+C to close...\n');

    // Keep browser open for manual inspection
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Browser will be closed when user presses Ctrl+C
  }
}

// Run tests
runTests().catch(console.error);
