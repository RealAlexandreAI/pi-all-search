import type { SearchProvider, SearchResult } from "./types.js";

export const BRAVE_META = { name: "brave", label: "Brave", envVar: "BRAVE_API_KEY" };

export class BraveProvider implements SearchProvider {
  name = "brave";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<{ results: SearchResult[] }> {
    const resp = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: { "X-Subscription-Token": this.apiKey, Accept: "application/json" },
        signal,
      }
    );
    const data = await resp.json();
    const results: SearchResult[] = ((data.web?.results ?? []) as any[]).slice(0, maxResults).map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.description ?? "",
    }));
    return { results };
  }
}
