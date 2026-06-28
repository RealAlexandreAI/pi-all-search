import type { SearchProvider } from "./providers/types.js";

export type SearchIntent = "finance" | "academic" | "general" | "docs" | "technical" | "news";

export interface RoutingConfig {
  primary: string;
  secondary: string[];
  intent: SearchIntent;
}

export function classifyIntent(query: string): SearchIntent {
  const q = query.toLowerCase();
  if (/\b(stock|price|ticker|forex|crypto|market|trade|earnings|fund|etf|ipo)\b/.test(q)) return "finance";
  if (/\b(paper|research|journal|doi|arxiv|scholar|academic|study|thesis)\b/.test(q)) return "academic";
  if (/\b(doc|docs|documentation|library|framework|api|sdk|how to|example|syntax|function|method|class|component)\b/.test(q)) return "docs";
  if (/\b(code|github|repo|repository|pull request|commit|branch|merge)\b/.test(q)) return "technical";
  if (/\b(news|latest|today|breaking|announced|update|release|happened)\b/.test(q)) return "news";
  return "general";
}

const INTENT_PROVIDERS: Record<SearchIntent, string[]> = {
  finance: ["anysearch", "exa", "tavily"],
  academic: ["exa", "anysearch", "tavily"],
  docs: ["context7", "exa", "tavily"],
  technical: ["firecrawl", "exa", "tavily"],
  news: ["tavily", "anysearch", "exa"],
  general: ["tavily", "anysearch", "exa", "firecrawl"],
};

export function routeIntent(
  intent: SearchIntent,
  providers: Map<string, SearchProvider>,
  requestedProvider?: string,
): RoutingConfig {
  if (requestedProvider && providers.has(requestedProvider)) {
    const secondary = [...providers.keys()].filter((k) => k !== requestedProvider);
    return { primary: requestedProvider, secondary, intent };
  }

  const candidates = INTENT_PROVIDERS[intent];
  const available = candidates.filter((p) => providers.has(p));

  if (available.length === 0) {
    const allAvailable = [...providers.keys()];
    return {
      primary: allAvailable[0] ?? "tavily",
      secondary: allAvailable.slice(1),
      intent,
    };
  }

  return {
    primary: available[0],
    secondary: available.slice(1),
    intent,
  };
}
