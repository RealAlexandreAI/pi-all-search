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

const INTENT_PROVIDERS: Record<SearchIntent, { primary: string; secondary: string[] }> = {
  finance: { primary: "anysearch", secondary: ["exa", "tavily"] },
  academic: { primary: "exa", secondary: ["anysearch", "tavily"] },
  docs: { primary: "context7", secondary: ["exa", "tavily"] },
  technical: { primary: "firecrawl", secondary: ["exa", "tavily"] },
  news: { primary: "tavily", secondary: ["anysearch", "exa"] },
  general: { primary: "tavily", secondary: ["anysearch", "exa", "firecrawl"] },
};

export function routeIntent(
  intent: SearchIntent,
  providers: Map<string, SearchProvider>,
  requestedProvider?: string,
): RoutingConfig {
  if (requestedProvider && providers.has(requestedProvider)) {
    return {
      primary: requestedProvider,
      secondary: [...providers.keys()].filter((k) => k !== requestedProvider),
      intent,
    };
  }

  const config = INTENT_PROVIDERS[intent];
  const available = config.primary === "anysearch" && !providers.has("anysearch")
    ? config.secondary.filter((p) => providers.has(p))
    : [config.primary, ...config.secondary].filter((p) => providers.has(p));

  return {
    primary: available[0] ?? "tavily",
    secondary: available.slice(1),
    intent,
  };
}
