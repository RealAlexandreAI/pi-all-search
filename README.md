# pi-all-search

**All-in-one web search extension for Pi — exa, tavily, anysearch, firecrawl, context7.**

## Install

```bash
pi install npm:pi-all-search
```

## Configure

Set API keys in `~/.pi/agent/extensions/pi-all-search/config.json`:

```json
{
  "apiKeys": {
    "exa": "exa-...",
    "tavily": "tvly-...",
    "anysearch": "as_sk_...",
    "firecrawl": "fc-...",
    "context7": "ctx7sk_..."
  },
  "provider": "auto",
  "cacheTtlMs": 300000,
  "maxResults": 5
}
```

Or set environment variables: `EXA_API_KEY`, `TAVILY_API_KEY`, `ANYSEARCH_API_KEY`, `FIRECRAWL_API_KEY`, `CONTEXT7_API_KEY`.

## Usage

```
web_search({ query: "TypeScript best practices" })
web_search({ queries: ["React vs Vue", "Angular vs Svelte"] })
web_search({ query: "AAPL stock price", provider: "anysearch" })
web_search({ query: "rust async programming", provider: "tavily" })
web_search({ query: "Next.js caching", provider: "context7" })
```

## Providers

| Provider | Best For | Env Var |
|----------|----------|---------|
| **exa** | Academic papers, scholarly search | `EXA_API_KEY` |
| **tavily** | General web, programming, fast results | `TAVILY_API_KEY` |
| **anysearch** | Finance, stocks, structured data | `ANYSEARCH_API_KEY` |
| **firecrawl** | Scraping-heavy sites, fallback | `FIRECRAWL_API_KEY` |
| **context7** | Library/framework/API documentation | `CONTEXT7_API_KEY` |

## Routing

Automatic intent-based routing:
- **Finance queries** → anysearch → exa → tavily
- **Academic queries** → exa → anysearch → tavily
- **General queries** → tavily → exa → anysearch → firecrawl
- **Docs queries** → context7 → exa → tavily

Override with `provider="exa"` etc.

## License

MIT
