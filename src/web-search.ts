import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { loadConfig, resolveApiKey } from "./config.js";
import { createAvailableProviders, PROVIDERS } from "./providers/index.js";
import type { SearchProvider, SearchResult } from "./providers/types.js";
import { classifyIntent, routeIntent, type SearchIntent } from "./router.js";
import { deduplicateResults, SafeMemoryCache } from "./utils.js";

export const searchCache = new SafeMemoryCache<any>(300000, 100);

const MIN_RESULTS = 1;
const MAX_RESULTS = 20;
const DEFAULT_RESULTS = 5;

function formatSearchResults(results: SearchResult[], provider: string): string {
  let out = `*${results.length} results via ${provider}*\n\n`;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    out += `${i + 1}. **${r.title}**\n`;
    out += `   ${r.url}\n`;
    const meta: string[] = [];
    if (r.publishedAt) meta.push(r.publishedAt.slice(0, 10));
    if (r.score !== undefined) meta.push(`score: ${r.score.toFixed(2)}`);
    if (meta.length > 0) out += `   *${meta.join(" · ")}*\n`;
    const snippet = r.snippet.slice(0, 300);
    if (snippet.trim().length > 0) {
      out += `   ${snippet}${r.snippet.length > 300 ? "..." : ""}\n`;
    }
    out += "\n";
  }
  return out.trimEnd();
}

function formatMultiQueryResults(
  allQueries: Array<{ query: string; results: SearchResult[]; provider: string }>,
): string {
  let out = "";
  for (const q of allQueries) {
    out += `## "${q.query}"\n`;
    out += formatSearchResults(q.results, q.provider);
    out += "\n---\n\n";
  }
  return out.trimEnd();
}

async function executeSingleSearch(
  providers: Map<string, SearchProvider>,
  query: string,
  maxResults: number,
  requestedProvider?: string,
  signal?: AbortSignal,
): Promise<{ results: SearchResult[]; provider: string; intent: SearchIntent }> {
  const intent = classifyIntent(query);
  const route = routeIntent(intent, providers, requestedProvider);
  void intent;

  let allResults: SearchResult[] = [];
  let usedProvider = route.primary;
  const errors: string[] = [];

  const primary = providers.get(route.primary);
  if (primary) {
    try {
      const resp = await primary.search(query, maxResults, signal);
      allResults = resp.results;
    } catch (err) {
      errors.push(`${route.primary}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (allResults.length === 0) {
    for (const name of route.secondary) {
      const p = providers.get(name);
      if (!p) continue;
      try {
        const resp = await p.search(query, maxResults, signal);
        allResults = resp.results;
        if (allResults.length > 0) {
          usedProvider = name;
          break;
        }
      } catch (err) {
        errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  if (allResults.length === 0 && errors.length > 0) {
    throw new Error(`All providers failed for "${query}":\n${errors.join("\n")}`);
  }

  return { results: deduplicateResults(allResults), provider: usedProvider, intent: route.intent };
}

async function executeSingleSearchWithTimeout(
  providers: Map<string, SearchProvider>,
  query: string,
  maxResults: number,
  requestedProvider?: string,
  signal?: AbortSignal,
  timeoutMs: number = 8000,
): Promise<{ results: SearchResult[]; provider: string; intent: SearchIntent }> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Search timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([
    executeSingleSearch(providers, query, maxResults, requestedProvider, signal).then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

export function registerWebSearchTool(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "web_search",
    label: "Web Search",
    description:
      "Search the web with 5 providers (exa, tavily, anysearch, firecrawl, context7). Choose the right provider based on query type. Falls back automatically if the primary provider fails. Use web_fetch for full page content. Use queries (plural) for parallel multi-angle research.",
    promptSnippet:
      "Search the web with automatic or custom routing (set provider='exa' for papers, provider='anysearch' for finance, provider='tavily' for general, provider='context7' for docs).",
    get promptGuidelines() {
      return [
        "Use web_search for information beyond your training data — current events, recent docs, live data.",
        "Choose the right provider based on the query type:",
        "  • context7 — library/framework/API documentation, code examples, how-to guides, syntax questions",
        "  • exa — academic research papers, journals, DOIs, scholarly articles, theses",
        "  • anysearch — stock prices, tickers, forex, crypto, CVE vulnerabilities, financial data",
        "  • firecrawl — scraping-heavy sites, code repos, GitHub content, when others fail",
        "  • tavily — general web search, news, programming guides, fast results (default)",
        "Set provider='auto' to let the local intent router decide automatically.",
        "After answering, include a \"Sources:\" section with markdown hyperlinks: [Title](URL).",
        "Use web_fetch after web_search to read full page content — web_search returns snippets only.",
        "Use {queries:[...]} with 2-4 varied angles for broader coverage.",
      ];
    },
    parameters: Type.Object({
      query: Type.Optional(
        Type.String({ description: "Single search query. Use 'queries' for multi-angle research." }),
      ),
      queries: Type.Optional(
        Type.Array(Type.String(), {
          description:
            "Multiple queries searched in parallel, each routed independently. Prefer 2-4 varied angles.",
        }),
      ),
      provider: Type.Optional(
        StringEnum(["auto", "exa", "tavily", "anysearch", "firecrawl", "context7"], {
          description:
            "Directly override the search provider. 'auto' uses local intent routing (default).",
          default: "auto",
        }),
      ),
      max_results: Type.Optional(
        Type.Number({
          description: `Results per query (${MIN_RESULTS}-${MAX_RESULTS}, default ${DEFAULT_RESULTS}).`,
          minimum: MIN_RESULTS,
          maximum: MAX_RESULTS,
          default: DEFAULT_RESULTS,
        }),
      ),
      freshness: Type.Optional(StringEnum(["day", "week", "month", "year"], { description: "Filter by recency." })),
    }),

    async execute(_toolCallId, params, signal, onUpdate) {
      const maxResults = Math.min(Math.max(params.max_results ?? DEFAULT_RESULTS, MIN_RESULTS), MAX_RESULTS);

      const queryList = (Array.isArray(params.queries) ? params.queries : [])
        .map((q) => (typeof q === "string" ? q.trim() : ""))
        .filter(Boolean);
      if (queryList.length === 0 && typeof params.query === "string" && params.query.trim()) {
        queryList.push(params.query.trim());
      }

      if (queryList.length === 0) {
        return {
          content: [{ type: "text", text: "No query provided. Use 'query' or 'queries' parameter." }],
          details: { error: "No query" },
        };
      }

      const requestedProvider = params.provider as string | undefined;
      const cacheKey = JSON.stringify({ queries: queryList, maxResults, provider: requestedProvider });
      const cached = searchCache.get(cacheKey);
      if (cached) {
        onUpdate?.({ content: [{ type: "text", text: "Searching... (Cache Hit!)" }], details: { phase: "searching", cacheHit: true } });
        return cached;
      }

      const config = loadConfig();
      const apiKeys: Record<string, string | undefined> = {};
      for (const meta of PROVIDERS) {
        apiKeys[meta.name] = resolveApiKey(meta.name, meta.envVar, config);
      }
      const providers = createAvailableProviders(apiKeys);

      if (providers.size === 0) {
        const envVars = PROVIDERS.map((p) => p.envVar).join(", ");
        return {
          content: [{ type: "text", text: `No search providers available. Set ${envVars}.` }],
          details: { error: "No providers" },
        };
      }

      let responsePayload: any;

      if (queryList.length > 1) {
        onUpdate?.({ content: [{ type: "text", text: `Searching ${queryList.length} queries in parallel...` }], details: { phase: "searching", queryCount: queryList.length } });
        const results = await Promise.all(
          queryList.map(async (q) => {
            try {
              const r = await executeSingleSearchWithTimeout(providers, q, maxResults, requestedProvider, signal);
              return { query: q, results: r.results, provider: r.provider, intent: r.intent };
            } catch (err) {
              return { query: q, results: [] as SearchResult[], provider: "error", intent: "general" as SearchIntent, error: err instanceof Error ? err.message : String(err) };
            }
          }),
        );
        const providers_used = [...new Set(results.map((r) => r.provider))];
        const totalResults = results.reduce((sum, r) => sum + r.results.length, 0);
        const errors = results.filter((r) => "error" in r && r.error);
        responsePayload = {
          content: [{ type: "text", text: formatMultiQueryResults(results) }],
          details: { queryCount: queryList.length, totalResults, providers: providers_used, errors: errors.length > 0 ? errors.map((e) => (e as any).error) : undefined },
        };
      } else {
        const query = queryList[0];
        onUpdate?.({ content: [{ type: "text", text: `Searching: "${query}"...` }], details: { phase: "searching" } });
        const { results, provider, intent } = await executeSingleSearchWithTimeout(providers, query, maxResults, requestedProvider, signal);
        const text = formatSearchResults(results, provider);
        responsePayload = { content: [{ type: "text", text }], details: { query, intent, provider, resultCount: results.length } };
      }

      searchCache.set(cacheKey, responsePayload);
      return responsePayload;
    },

    renderCall(args, theme) {
      const ql = Array.isArray(args.queries) ? args.queries.filter((q: unknown) => typeof q === "string") : [];
      if (ql.length > 1) {
        return new Text(theme.fg("toolTitle", theme.bold("Search ")) + theme.fg("accent", `${ql.length} queries`), 0, 0);
      }
      const q = (args.query as string) || ql[0] || "";
      const display = q.length > 60 ? `${q.slice(0, 57)}...` : q;
      return new Text(theme.fg("toolTitle", theme.bold("Search ")) + theme.fg("accent", `"${display}"`), 0, 0);
    },

    renderResult(result, { isPartial }, theme) {
      if (isPartial) {
        const d = result.details as { phase?: string; queryCount?: number } | undefined;
        if (d?.queryCount) {
          return new Text(theme.fg("warning", `Searching ${d.queryCount} queries...`), 0, 0);
        }
        return new Text(theme.fg("warning", "Searching..."), 0, 0);
      }
      const d = result.details as { resultCount?: number; totalResults?: number; provider?: string; providers?: string[]; error?: string } | undefined;
      if (d?.error) return new Text(theme.fg("error", d.error), 0, 0);
      const count = d?.totalResults ?? d?.resultCount ?? 0;
      const provider = d?.providers?.join("+") ?? d?.provider ?? "?";
      const label = `✓ ${count} results via ${provider}`;
      return new Text(theme.fg("success", label), 0, 0);
    },
  });
}
