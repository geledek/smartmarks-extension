/// <reference types="chrome"/>

export interface PageMetadata {
  title?: string;
  description?: string;
  favicon?: string;
  keywords?: string[];
  author?: string;
  publishDate?: string;
}

/**
 * Extract metadata from a URL by fetching and parsing the HTML
 * This replaces content scripts - runs from service worker using fetch()
 * Handles CORS errors gracefully - many sites block extension fetches
 */
export async function extractMetadata(url: string): Promise<PageMetadata> {
  const metadata: PageMetadata = {};

  try {
    // Fetch the page HTML
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'SmartMarks/1.0'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return metadata;
    }

    const html = await response.text();

    // Parse HTML without DOM (service worker has no DOM)
    metadata.title = extractTitle(html);
    metadata.description = extractDescription(html);
    metadata.favicon = extractFavicon(html, url);
    metadata.keywords = extractKeywords(html);
    metadata.author = extractAuthor(html);
    metadata.publishDate = extractPublishDate(html);

  } catch (error) {
    // CORS error or timeout - this is expected for many sites
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.debug(`CORS blocked or fetch failed for ${url}`);
    } else {
      console.warn(`Failed to extract metadata from ${url}:`, error);
    }
  }

  return metadata;
}

/**
 * Extract page title from HTML
 * Priority: og:title > twitter:title > <title> tag
 */
function extractTitle(html: string): string | undefined {
  // Try Open Graph title
  let match = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (match) return decodeHtmlEntities(match[1]);

  // Try Twitter title
  match = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
  if (match) return decodeHtmlEntities(match[1]);

  // Try regular title tag
  match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (match) return decodeHtmlEntities(match[1]);

  return undefined;
}

/**
 * Extract page description from HTML
 * Priority: og:description > twitter:description > meta description
 */
function extractDescription(html: string): string | undefined {
  // Try Open Graph description
  let match = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  if (match) return decodeHtmlEntities(match[1]);

  // Try Twitter description
  match = html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
  if (match) return decodeHtmlEntities(match[1]);

  // Try standard meta description
  match = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (match) return decodeHtmlEntities(match[1]);

  return undefined;
}

/**
 * Extract favicon URL from HTML
 */
function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Try various favicon link formats
  const patterns = [
    /<link\s+rel=["']icon["']\s+href=["']([^"']+)["']/i,
    /<link\s+rel=["']shortcut icon["']\s+href=["']([^"']+)["']/i,
    /<link\s+href=["']([^"']+)["']\s+rel=["']icon["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const faviconUrl = match[1];
      // Convert relative URL to absolute
      if (faviconUrl.startsWith('http')) {
        return faviconUrl;
      } else if (faviconUrl.startsWith('//')) {
        return 'https:' + faviconUrl;
      } else if (faviconUrl.startsWith('/')) {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}${faviconUrl}`;
      } else {
        const base = new URL(baseUrl);
        return `${base.protocol}//${base.host}/${faviconUrl}`;
      }
    }
  }

  // Fallback to standard /favicon.ico
  try {
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}/favicon.ico`;
  } catch {
    return undefined;
  }
}

/**
 * Extract keywords from HTML
 */
function extractKeywords(html: string): string[] | undefined {
  const match = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  if (match) {
    return match[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
  }
  return undefined;
}

/**
 * Extract author from HTML
 */
function extractAuthor(html: string): string | undefined {
  // Try various author meta tags
  const patterns = [
    /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i,
    /<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']twitter:creator["']\s+content=["']([^"']+)["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }

  return undefined;
}

/**
 * Extract publish date from HTML
 */
function extractPublishDate(html: string): string | undefined {
  // Try various date meta tags
  const patterns = [
    /<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']date["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']DC\.date["']\s+content=["']([^"']+)["']/i,
    /<time\s+datetime=["']([^"']+)["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }

  return undefined;
}

/**
 * Decode HTML entities (e.g., &amp; -> &, &quot; -> ")
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' '
  };

  return text.replace(/&[a-z0-9]+;/gi, (entity) => {
    return entities[entity.toLowerCase()] || entity;
  });
}

/**
 * Batch extract metadata for multiple URLs
 * Processes in chunks to avoid overwhelming the service worker
 */
export async function batchExtractMetadata(
  urls: string[],
  chunkSize: number = 10
): Promise<Map<string, PageMetadata>> {
  const results = new Map<string, PageMetadata>();

  for (let i = 0; i < urls.length; i += chunkSize) {
    const chunk = urls.slice(i, i + chunkSize);
    const promises = chunk.map(async (url) => {
      const metadata = await extractMetadata(url);
      return { url, metadata };
    });

    const chunkResults = await Promise.all(promises);
    chunkResults.forEach(({ url, metadata }) => {
      results.set(url, metadata);
    });

    // Small delay between chunks to avoid rate limiting
    if (i + chunkSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
