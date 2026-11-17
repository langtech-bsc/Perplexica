import { getSearxngURL } from './config/serverRegistry';

export interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

/* Plain web searches (no specific engines requested) go to OpenSERP when configured */
const searchOpenserp = async (openserpURL: string, query: string) => {
  const url = new URL(`${openserpURL}/mega/search`);
  url.searchParams.append('text', query);
  url.searchParams.append(
    'engines',
    process.env.OPENSERP_ENGINES || 'google,bing,duck',
  );
  url.searchParams.append('limit', '10');
  url.searchParams.append('region', 'ES');

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });

  if (!res.ok) {
    throw new Error(`OpenSERP error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  const results: SearxngSearchResult[] = (data.results ?? [])
    .filter((r: any) => !r.type || r.type === 'organic')
    .map((r: any) => ({ title: r.title, url: r.url, content: r.snippet }));

  return { results, suggestions: [] as string[] };
};

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const openserpURL = process.env.OPENSERP_URL;

  if (openserpURL && !opts?.engines?.length) {
    try {
      return await searchOpenserp(openserpURL, query);
    } catch (err) {
      console.error('OpenSERP failed, falling back to SearXNG:', err);
    }
  }

  const searxngURL = getSearxngURL();

  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      const value = opts[key as keyof SearxngSearchOptions];
      if (Array.isArray(value)) {
        url.searchParams.append(key, value.join(','));
        return;
      }
      url.searchParams.append(key, value as string);
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`SearXNG error: ${res.statusText}`);
    }

    const data = await res.json();

    const results: SearxngSearchResult[] = data.results;
    const suggestions: string[] = data.suggestions;

    return { results, suggestions };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('SearXNG search timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};
