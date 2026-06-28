import { EXA_META, ExaProvider } from "./exa.js";
import { TAVILY_META, TavilyProvider } from "./tavily.js";
import { ANYSEARCH_META, AnysearchProvider } from "./anysearch.js";
import { FIRECRAWL_META, FirecrawlProvider } from "./firecrawl.js";
import { BRAVE_META, BraveProvider } from "./brave.js";
import type { SearchProvider } from "./types.js";

export interface ProviderMeta {
  name: string;
  label: string;
  envVar: string;
}

export const PROVIDERS: readonly ProviderMeta[] = [
  EXA_META,
  TAVILY_META,
  ANYSEARCH_META,
  FIRECRAWL_META,
  BRAVE_META,
];

export function createProvider(name: string, apiKey: string): SearchProvider {
  switch (name) {
    case "exa":
      return new ExaProvider(apiKey);
    case "tavily":
      return new TavilyProvider(apiKey);
    case "anysearch":
      return new AnysearchProvider(apiKey);
    case "firecrawl":
      return new FirecrawlProvider(apiKey);
    case "brave":
      return new BraveProvider(apiKey);
    default:
      throw new Error(`Unknown provider: "${name}". Available: ${PROVIDERS.map((p) => p.name).join(", ")}`);
  }
}

export function createAvailableProviders(apiKeys: Record<string, string | undefined>): Map<string, SearchProvider> {
  const providers = new Map<string, SearchProvider>();
  for (const meta of PROVIDERS) {
    const key = apiKeys[meta.name];
    if (!key) continue;
    try {
      providers.set(meta.name, createProvider(meta.name, key));
    } catch {
      // skip
    }
  }
  return providers;
}
