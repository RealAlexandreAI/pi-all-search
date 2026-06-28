import type { SearchProvider } from "./providers/types.js";

export type SearchIntent = "finance" | "academic" | "general";

export function classifyIntent(query: string): SearchIntent {
  const q = query.toLowerCase();
  if (/\b(stock|price|ticker|forex|crypto|market|trade|earnings)\b/.test(q)) return "finance";
  if (/\b(paper|research|journal|doi|arxiv|scholar|academic|study)\b/.test(q)) return "academic";
  return "general";
}

const INTENT PROVIDERS: Record<SearchIntent, { primary: string; secondary: string[] }> = {
  finance: { primary: "anysearch", secondary: ["brave", "exa"] },
  academic: { primary: "exa", secondary: ["anysearch", "brave"] },
  general: { primary: "tavily", secondary: ["brave", "exa", "anysearch"] },
};

export function routeIntent(
  intent: SearchIntent,
  providers: Map<string, SearchProvider>,
  requestedProvider?: string
): { primary: string; secondary: string[] } {
  if (requestedProvider && providers.has(requestedProvider)) {
    return { primary: requestedProvider, secondary: [...providers.keys()].filter((k) => k !== requestedProvider) };
  }
  return INTENT_PROVIDERS[intent];
}
