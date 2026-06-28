import type { SearchProvider, SearchResult } from "./types.js";

export const TAVILY_META = { name: "tavily", label: "Tavily", envVar: "TAVILY_API_KEY" };

export class TavilyProvider implements SearchProvider {
  name = "tavily";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<{ results: SearchResult[] }> {
    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey, query, max_results: maxResults, search_depth: "basic" }),
      signal,
    });
    const data = await resp.json();
    const results: SearchResult[] = (data.results ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.content ?? "",
      score: r.score,
    }));
    return { results };
  }

  async research(query: string, signal?: AbortSignal): Promise<string> {
    const resp = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey, query, search_depth: "advanced", include_answer: true }),
      signal,
    });
    const data = await resp.json();
    return data.answer ?? "";
  }
}
