import { PROVIDERS } from "./providers/index.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CONFIG_PATH = join(homedir(), ".pi", "pi-all-search.json");

export interface SearchConfig {
  apiKeys: Record<string, string>;
}

export function loadConfig(): SearchConfig {
  const apiKeys: Record<string, string> = {};

  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    for (const meta of PROVIDERS) {
      const key = config[meta.name + "ApiKey"];
      if (key) apiKeys[meta.name] = key;
    }
  } catch {
    // fallback to env vars
    const env = process.env;
    for (const meta of PROVIDERS) {
      const key = env[meta.envVar];
      if (key) apiKeys[meta.name] = key;
    }
  }

  return { apiKeys };
}

export function resolveApiKey(name: string, envVar: string, config: SearchConfig): string | undefined {
  return config.apiKeys[name] ?? process.env[envVar];
}
