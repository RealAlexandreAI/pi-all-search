import type { SearchProvider, SearchResult } from "./types.js";

export const FIRECRAWL_META = { name: "firecrawl", label: "Firecrawl", envVar: "FIRECRAWL_API_KEY" };

export class FirecrawlProvider implements SearchProvider {
  name = "firecrawl";
  constructor(private apiKey?: string) {}

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers,
      body: JSON.stringify({ query, limit: maxResults }),
    });
    if (!resp.ok) throw new Error(`Firecrawl HTTP ${resp.status}`);
    const data = await resp.json();
    const results: SearchResult[] = (data.data ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.description ?? "",
    }));
    return { results };
  }
}
