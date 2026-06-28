import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";

const DOMAINS = [
  "general",
  "resource",
  "social_media",
  "finance",
  "academic",
  "legal",
  "health",
  "business",
  "security",
  "ip",
  "code",
  "energy",
  "environment",
  "agriculture",
  "travel",
  "film",
  "gaming",
] as const;

interface SubDomain {
  sub_domain: string;
  description: string;
  params: Record<string, string>;
}

const SUB_DOMAIN_DB: Record<string, SubDomain[]> = {
  finance: [
    { sub_domain: "finance.us_stock", description: "US stock market data", params: { ticker: "" } },
    { sub_domain: "finance.crypto", description: "Cryptocurrency data", params: { symbol: "" } },
    { sub_domain: "finance.forex", description: "Foreign exchange rates", params: { pair: "" } },
    { sub_domain: "finance.fund", description: "Fund/ETF data", params: { symbol: "" } },
  ],
  academic: [
    { sub_domain: "academic.search", description: "Academic papers and research", params: { doi: "" } },
    { sub_domain: "academic.patent", description: "Patent search", params: { patent_number: "" } },
  ],
  legal: [
    { sub_domain: "legal.legislation", description: "Laws and regulations", params: {} },
    { sub_domain: "legal.case", description: "Legal cases", params: {} },
  ],
  health: [
    { sub_domain: "health.policy", description: "Healthcare policy", params: {} },
    { sub_domain: "health.drug", description: "Drug information", params: { name: "" } },
    { sub_domain: "health.medical", description: "Medical information", params: { condition: "" } },
  ],
  business: [
    { sub_domain: "business.market_research", description: "Market research", params: {} },
    { sub_domain: "business.company", description: "Company information", params: { name: "" } },
  ],
  security: [
    { sub_domain: "security.cve", description: "CVE vulnerability database", params: { cve: "" } },
    { sub_domain: "security.threat", description: "Threat intelligence", params: {} },
  ],
  code: [
    { sub_domain: "code.repository", description: "Code repositories", params: { repo: "" } },
    { sub_domain: "code.docs", code: "Code documentation", params: { library: "" } },
  ],
  environment: [
    { sub_domain: "environment.climate", description: "Climate data", params: {} },
    { sub_domain: "environment.aqi", description: "Air quality index", params: { city: "" } },
  ],
  energy: [
    { sub_domain: "energy.market", description: "Energy market data", params: {} },
    { sub_domain: "energy.renewable", description: "Renewable energy", params: {} },
  ],
  agriculture: [
    { sub_domain: "agriculture.market", description: "Agricultural market", params: {} },
    { sub_domain: "agriculture.weather", description: "Weather data", params: { location: "" } },
  ],
  travel: [
    { sub_domain: "travel.flight", description: "Flight status", params: { iata: "" } },
    { sub_domain: "travel.hotel", description: "Hotel booking", params: {} },
  ],
  film: [
    { sub_domain: "film.movie", description: "Movie information", params: { title: "" } },
    { sub_domain: "film.tv", description: "TV show information", params: { title: "" } },
  ],
  gaming: [
    { sub_domain: "gaming.game", description: "Game information", params: { title: "" } },
    { sub_domain: "gaming.hardware", description: "Gaming hardware", params: {} },
  ],
  social_media: [
    { sub_domain: "social_media.twitter", description: "Twitter/X posts", params: { username: "" } },
    { sub_domain: "social_media.reddit", description: "Reddit posts", params: { subreddit: "" } },
  ],
  ip: [
    { sub_domain: "ip.address", description: "IP address lookup", params: { ip: "" } },
    { sub_domain: "ip.domain", description: "Domain lookup", params: { domain: "" } },
  ],
};

export function registerGetSubDomainsTool(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "get_sub_domains",
    label: "Discover Domains",
    description:
      "Discover available vertical domains and their sub-domains for structured search. Use before web_search when the query targets a specialized vertical (finance, health, legal, etc.).",
    promptGuidelines: [
      "Use get_sub_domains when the query targets a specialized vertical domain.",
      "Use before web_search to discover available sub-domains and parameters.",
      "Pass ALL potentially relevant domains at once for broader coverage.",
    ],
    parameters: Type.Object({
      domains: Type.Array(
        Type.String({
          description: "Domain(s) to discover. Pass all potentially relevant domains.",
        }),
        { description: "List of domains to query. Max 5.", maxItems: 5 },
      ),
    }),

    async execute(_toolCallId, params) {
      const domains = (params.domains as string[]) ?? [];
      const results: Array<{ domain: string; sub_domain: string; description: string; params: Record<string, string> }> = [];

      for (const domain of domains) {
        const subs = SUB_DOMAIN_DB[domain];
        if (subs) {
          for (const sub of subs) {
            results.push({ domain, ...sub });
          }
        }
      }

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: "No sub-domains found for the given domains. Try: finance, academic, legal, health, business, security, code, energy, environment, agriculture, travel, film, gaming." }],
          details: { count: 0 },
        };
      }

      const markdown = results
        .map((r) => `- **${r.domain}/${r.sub_domain}**: ${r.description} (params: ${Object.keys(r.params).join(", ") || "none"})`)
        .join("\n");

      return {
        content: [{ type: "text", text: markdown }],
        details: { count: results.length },
      };
    },

    renderCall(args, theme) {
      const domains = (args.domains as string[]) ?? [];
      return new Text(
        theme.fg("toolTitle", theme.bold("Domains ")) + theme.fg("accent", domains.join(", ")),
        0,
        0,
      );
    },

    renderResult(result, { isPartial }, theme) {
      if (isPartial) return new Text(theme.fg("warning", "Discovering..."), 0, 0);
      const d = result.details as { count?: number } | undefined;
      return new Text(theme.fg("success", `✓ ${d?.count ?? 0} sub-domains found`), 0, 0);
    },
  });
}
