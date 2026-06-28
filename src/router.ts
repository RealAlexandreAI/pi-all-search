import type { SearchProvider } from "./providers/types.js";

export type SearchIntent = "finance" | "academic" | "general" | "docs";

export function classifyIntent(query: string): SearchIntent {
  const q = query.toLowerCase();
  if (/\b(stock|price|ticker|forex|crypto|market|trade|earnings)\b/.test(q)) return "finance";
  if (/\b(paper|research|journal|doi|arxiv|scholar|academic|study)\b/.test(q)) return "academic";
  if (/\b(doc|docs|documentation|library|framework|api|sdk|how to|example|syntax)\b/.test(q)) return "docs";
  return "general";
}

const INTENT_PROVIDERS: Record<SearchIntent, { primary: string; secondary: string[] }> = {
  finance: { primary: "anysearch", secondary: ["exa", "tavily"] },
  academic: { primary: "exa", secondary: ["anysearch", "tavily"] },
  general: { primary: "tavily", secondary: ["exa", "anysearch", "firecrawl"] },
  docs: { primary: "context7", secondary: ["exa", "tavily"] },
};

export function routeIntent(
  intent: SearchIntent,
  providers: Map<string, SearchProvider>,
  requestedProvider?: string,
): { primary: string; secondary: string[] } {
  if (requestedProvider && providers.has(requestedProvider)) {
    return { primary: requestedProvider, secondary: [...providers.keys()].filter((k) => k !== requestedProvider) };
  }
  return INTENT_PROVIDERS[intent];
}
