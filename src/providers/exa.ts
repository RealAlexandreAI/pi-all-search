import type { SearchProvider, SearchResult } from "./types.js";

export const EXA_META = { name: "exa", label: "Exa", envVar: "EXA_API_KEY" };

export class ExaProvider implements SearchProvider {
  name = "exa";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const resp = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": this.apiKey },
      body: JSON.stringify({
        query,
        numResults: maxResults,
        type: "neural",
        contents: { text: { maxCharacters: 300 } },
      }),
    });
    if (!resp.ok) throw new Error(`Exa HTTP ${resp.status}`);
    const data = await resp.json();
    const results: SearchResult[] = (data.results ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.text ?? "",
      score: r.score,
    }));
    return { results };
  }
}
