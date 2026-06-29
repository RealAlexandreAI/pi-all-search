import type { SearchProvider, SearchResult } from "./types.js";

export const ANYSEARCH_META = { name: "anysearch", label: "AnySearch", envVar: "ANYSEARCH_API_KEY" };

export class AnysearchProvider implements SearchProvider {
  name = "anysearch";
  constructor(private apiKey: string) {}

  async search(query: string, maxResults: number): Promise<{ results: SearchResult[] }> {
    const resp = await fetch("https://api.anysearch.com/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "search", arguments: { query, max_results: maxResults } },
      }),
    });
    if (!resp.ok) throw new Error(`AnySearch HTTP ${resp.status}`);
    const data = await resp.json();
    const text = data.result?.content?.[0]?.text ?? "";
    return { results: this.parseResults(text) };
  }

  private parseResults(text: string): SearchResult[] {
    const results: SearchResult[] = [];
    const sections = text.split(/^### \d+\. /m).slice(1);
    for (const section of sections) {
      const lines = section.trim().split("\n");
      const title = lines[0]?.trim() ?? "";
      const urlLine = lines.find((l) => l.startsWith("- **URL**:"));
      const url = urlLine?.replace("- **URL**: ", "").replace(/\*\*/g, "").trim() ?? "";
      const snippet = lines
        .filter((l) => !l.startsWith("- **URL**:") && l.trim() && !l.startsWith("#"))
        .join(" ")
        .slice(0, 300);
      if (title) results.push({ title, url, snippet });
    }
    return results;
  }
}
