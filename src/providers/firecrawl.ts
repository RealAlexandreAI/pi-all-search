import type { SearchProvider, SearchResult } from "./types.js";

export const FIRECRAWL_META = { name: "firecrawl", label: "Firecrawl", envVar: "FIRECRAWL_API_KEY" };

export class FirecrawlProvider implements SearchProvider {
  name = "firecrawl";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ query, limit: maxResults }),
    });
    const data = await resp.json();
    const results: SearchResult[] = (data.data ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.description ?? "",
    }));
    return { results };
  }
}
