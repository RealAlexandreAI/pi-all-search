import type { SearchProvider, SearchResult } from "./types.js";

export const CONTEXT7_META = { name: "context7", label: "Context7", envVar: "CONTEXT7_API_KEY" };

export class Context7Provider implements SearchProvider {
  name = "context7";
  constructor(private apiKey: string) {}

  private async searchLibrary(query: string): Promise<{ id: string; title: string } | null> {
    const resp = await fetch(
      `https://context7.com/api/v2/libs/search?libraryName=${encodeURIComponent(query)}&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    const data = await resp.json();
    return data.results?.[0] ?? null;
  }

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const lib = await this.searchLibrary(query);
    if (!lib) return { results: [] };

    const resp = await fetch(
      `https://context7.com/api/v2/context?libraryId=${encodeURIComponent(lib.id)}&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    const data = await resp.json();
    const results: SearchResult[] = (data.context ?? data.results ?? []).slice(0, maxResults).map((r: any) => ({
      title: r.title ?? r.name ?? lib.title,
      url: r.url ?? r.source ?? `https://context7.com${lib.id}`,
      snippet: r.content ?? r.snippet ?? r.description ?? "",
    }));
    return { results };
  }
}
