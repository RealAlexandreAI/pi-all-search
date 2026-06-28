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
      `https://context7.com/api/v2/context?libraryId=${encodeURIComponent(lib.id)}&query=${encodeURIComponent(query)}&type=json`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    const data = await resp.json();
    const results: SearchResult[] = [];

    for (const snippet of data.codeSnippets ?? []) {
      if (results.length >= maxResults) break;
      results.push({
        title: snippet.pageTitle ?? snippet.codeTitle ?? lib.title,
        url: snippet.codeId ?? `https://context7.com${lib.id}`,
        snippet: snippet.codeDescription ?? snippet.codeList?.map((c: any) => c.code).join("\n") ?? "",
      });
    }

    for (const snippet of data.infoSnippets ?? []) {
      if (results.length >= maxResults) break;
      results.push({
        title: snippet.breadcrumb ?? snippet.pageId ?? lib.title,
        url: snippet.pageId ?? `https://context7.com${lib.id}`,
        snippet: snippet.content ?? "",
      });
    }

    return { results };
  }
}
