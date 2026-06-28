# pi-all-search

**All-in-one web search extension for Pi — exa, tavily, anysearch, firecrawl, brave.**

## Install

```bash
pi install npm:pi-all-search
```

## Configure

Set API keys in environment or `~/.pi/web-search.json`:

```json
{
  "exaApiKey": "exa-...",
  "tavilyApiKey": "tvly-...",
  "anysearchApiKey": "as_sk_...",
  "firecrawlApiKey": "fc-...",
  "braveApiKey": "BSA_..."
}
```

Or set environment variables: `EXA_API_KEY`, `TAVILY_API_KEY`, `ANYSEARCH_API_KEY`, `FIRECRAWL_API_KEY`, `BRAVE_API_KEY`.

## Usage

```
web_search({ query: "TypeScript best practices" })
web_search({ queries: ["React vs Vue", "Angular vs Svelte"] })
web_search({ query: "AAPL stock price", provider: "anysearch" })
web_search({ query: "rust async programming", provider: "tavily" })
```

## Providers

| Provider | Best For | Env Var |
|----------|----------|---------|
| **exa** | Academic papers, scholarly search | `EXA_API_KEY` |
| **tavily** | General web, programming, fast results | `TAVILY_API_KEY` |
| **anysearch** | Finance, stocks, structured data | `ANYSEARCH_API_KEY` |
| **firecrawl** | Scraping-heavy sites, fallback | `FIRECRAWL_API_KEY` |
| **brave** | General web, good coverage | `BRAVE_API_KEY` |

## Routing

Automatic intent-based routing:
- **Finance queries** → anysearch → brave → exa
- **Academic queries** → exa → anysearch → brave
- **General queries** → tavily → brave → exa → anysearch

Override with `provider="exa"` etc.

## License

MIT
