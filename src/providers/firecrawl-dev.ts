import type { SearchProvider, SearchResult } from "./types.js";

export const FIRECRAWL_DEV_META = { name: "firecrawl-dev", label: "Firecrawl Developer Index", envVar: "FIRECRAWL_API_KEY" };

/**
 * Firecrawl Developer Index — purpose-built artifact index for coding agents.
 * Indexes READMEs, issues, pull requests, OpenAPI specs, skills and external
 * docs (70M+ artifacts) with semantic retrieval + metadata filters. NOT a
 * general web search: only returns developer artifacts.
 *
 * Endpoint: POST /v2/search/developer. Works without an API key at lower rate
 * limits; key (same FIRECRAWL_API_KEY as the plain firecrawl provider) raises
 * the limit.
 *
 * Response artifacts carry a stable id with a kind prefix
 * (doc:/issue:/pull_request:/readme:) and markdown passages.
 */
export class FirecrawlDevProvider implements SearchProvider {
  name = "firecrawl-dev";
  constructor(private apiKey?: string) {}

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<{ results: SearchResult[] }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const resp = await fetch("https://api.firecrawl.dev/v2/search/developer", {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({ query, limit: maxResults }),
    });
    if (!resp.ok) throw new Error(`Firecrawl Developer Index HTTP ${resp.status}`);
    const data = await resp.json();
    return { results: parseDeveloperResults(data) };
  }
}

/** Map Firecrawl Developer Index API payload to SearchResult[]. Pure logic. */
export function parseDeveloperResults(data: any): SearchResult[] {
  return (data?.data ?? []).map((r: any) => ({
    title: r.title ?? r.id ?? "",
    url: r.url ?? "",
    snippet:
      r.description ??
      (Array.isArray(r.passages) ? r.passages.slice(0, 3).join(" ") : "") ??
      "",
  }));
}
