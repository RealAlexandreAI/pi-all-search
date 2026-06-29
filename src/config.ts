import { PROVIDERS } from "./providers/index.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, "..", "config.json");

export interface SearchConfig {
  apiKeys: Record<string, string>;
  provider?: string;
  cacheTtlMs?: number;
  maxResults?: number;
}

export function loadConfig(): SearchConfig {
  const apiKeys: Record<string, string> = {};
  const env = process.env;

  for (const meta of PROVIDERS) {
    const key = env[meta.envVar];
    if (key) apiKeys[meta.name] = key;
  }

  let provider: string | undefined;
  let cacheTtlMs: number | undefined;
  let maxResults: number | undefined;

  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    provider = config.provider;
    cacheTtlMs = config.cacheTtlMs;
    maxResults = config.maxResults;
  } catch {
    // use defaults
  }

  return { apiKeys, provider, cacheTtlMs, maxResults };
}

export function resolveApiKey(name: string, envVar: string, config: SearchConfig): string | undefined {
  return config.apiKeys[name] ?? process.env[envVar];
}
