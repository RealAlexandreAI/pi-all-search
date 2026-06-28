import type { SearchProvider, SearchResult } from "./types.js";

export const CONTEXT7_META = { name: "context7", label: "Context7", envVar: "CONTEXT7_API_KEY" };

export class Context7Provider implements SearchProvider {
  name = "context7";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const resp = await fetch("https://api.context7.com/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, limit: maxResults }),
    });
    const data = await resp.json();
    const results: SearchResult[] = (data.results ?? []).map((r: any) => ({
      title: r.title ?? r.name ?? "",
      url: r.url ?? r.documentation_url ?? "",
      snippet: r.description ?? r.snippet ?? "",
      score: r.score,
    }));
    return { results };
  }
}
