// ─── Search Provider Interface ────────────────────────────────────────
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  score?: number;
}

export interface SearchProvider {
  name: string;
  search(query: string, maxResults: number, signal?: AbortSignal): Promise<{ results: SearchResult[] }>;
  research?(query: string, signal?: AbortSignal): Promise<string>;
  verticalSearch?(domain: string, subDomain: string, query: string, maxResults: number, signal?: AbortSignal): Promise<{ results: SearchResult[] }>;
}

export interface ProviderMeta {
  name: string;
  label: string;
  envVar: string;
}
