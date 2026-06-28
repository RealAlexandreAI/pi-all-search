import type { SearchProvider, SearchResult } from "./types.js";

export const ANYSEARCH_META = { name: "anysearch", label: "AnySearch", envVar: "ANYSEARCH_API_KEY" };

export class AnysearchProvider implements SearchProvider {
  name = "anysearch";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const resp = await fetch("https://api.anysearch.dev/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ q: query, limit: maxResults }),
    });
    const data = await resp.json();
    const results: SearchResult[] = (data.results ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.description ?? r.snippet ?? "",
      score: r.score,
    }));
    return { results };
  }

  async verticalSearch(domain: string, subDomain: string, query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    return this.search(query, maxResults);
  }
}
