import { PROVIDERS } from "./providers/index.js";

export interface SearchConfig {
  apiKeys: Record<string, string>;
  routing?: {
    finance?: string;
    academic?: string;
    general?: string;
  };
}

export function loadConfig(): SearchConfig {
  const env = process.env;
  const apiKeys: Record<string, string> = {};
  for (const meta of PROVIDERS) {
    const key = env[meta.envVar];
    if (key) apiKeys[meta.name] = key;
  }
  return { apiKeys };
}

export function resolveApiKey(name: string, envVar: string, config: SearchConfig): string | undefined {
  return config.apiKeys[name] ?? process.env[envVar];
}
