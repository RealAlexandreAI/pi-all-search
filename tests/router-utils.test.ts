import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { classifyIntent, routeIntent } from "../src/router.js";
import { deduplicateResults, SafeMemoryCache } from "../src/utils.js";
import type { SearchProvider } from "../src/providers/types.js";

function mockProvider(name: string): SearchProvider {
  return { id: name } as SearchProvider;
}

describe("classifyIntent", () => {
  test("finance keywords", () => {
    assert.equal(classifyIntent("TSLA stock price today"), "finance");
    assert.equal(classifyIntent("bitcoin crypto market cap"), "finance");
    assert.equal(classifyIntent("AAPL earnings q3"), "finance");
  });

  test("academic keywords", () => {
    assert.equal(classifyIntent("arxiv paper on attention"), "academic");
    assert.equal(classifyIntent("doi research journal"), "academic");
  });

  test("docs keywords", () => {
    assert.equal(classifyIntent("fastapi documentation"), "docs");
    assert.equal(classifyIntent("how to use array.map syntax"), "docs");
  });

  test("technical keywords", () => {
    assert.equal(classifyIntent("github repo react"), "technical");
    assert.equal(classifyIntent("pull request review"), "technical");
  });

  test("news keywords", () => {
    assert.equal(classifyIntent("latest news today"), "news");
    assert.equal(classifyIntent("breaking announcement"), "news");
  });

  test("fallback to general", () => {
    assert.equal(classifyIntent("what is the weather like"), "general");
  });

  test("case insensitive", () => {
    assert.equal(classifyIntent("STOCK Market"), "finance");
  });
});

describe("routeIntent", () => {
  const providers = new Map<string, SearchProvider>();
  for (const id of ["tavily", "exa", "anysearch", "firecrawl", "context7"]) {
    providers.set(id, mockProvider(id));
  }

  test("honors requested provider when available", () => {
    const r = routeIntent("general", providers, "exa");
    assert.equal(r.primary, "exa");
    assert.ok(r.secondary.includes("tavily"));
    assert.ok(!r.secondary.includes("exa"));
  });

  test("falls back to intent candidates when requested provider missing", () => {
    const r = routeIntent("general", providers, "missing-provider");
    assert.equal(r.primary, "tavily");
  });

  test("docs intent prefers context7 first", () => {
    const r = routeIntent("docs", providers);
    assert.equal(r.primary, "context7");
  });

  test("news intent prefers tavily first", () => {
    const r = routeIntent("news", providers);
    assert.equal(r.primary, "tavily");
  });

  test("falls back to any available provider when intent candidates absent", () => {
    const only = new Map<string, SearchProvider>([["weird", mockProvider("weird")]]);
    const r = routeIntent("finance", only);
    assert.equal(r.primary, "weird");
  });

  test("defaults to tavily when no providers at all", () => {
    const r = routeIntent("finance", new Map());
    assert.equal(r.primary, "tavily");
  });
});

describe("deduplicateResults", () => {
  test("drops duplicates by url", () => {
    const results = [
      { title: "a", url: "https://x.com/1" },
      { title: "a-dup", url: "https://x.com/1" },
      { title: "b", url: "https://x.com/2" },
    ] as any[];
    const out = deduplicateResults(results);
    assert.equal(out.length, 2);
    assert.equal(out[0].title, "a");
  });

  test("drops duplicates by title when url missing", () => {
    const results = [
      { title: "same", url: undefined },
      { title: "same", url: undefined },
    ] as any[];
    const out = deduplicateResults(results);
    assert.equal(out.length, 1);
  });

  test("keeps distinct results", () => {
    const results = [
      { title: "a", url: "https://x.com/1" },
      { title: "b", url: "https://x.com/2" },
    ] as any[];
    assert.equal(deduplicateResults(results).length, 2);
  });
});

describe("SafeMemoryCache", () => {
  test("returns undefined for missing key", () => {
    const c = new SafeMemoryCache<string>(1000, 10);
    assert.equal(c.get("nope"), undefined);
  });

  test("stores and retrieves within ttl", () => {
    const c = new SafeMemoryCache<string>(10_000, 10);
    c.set("k", "v");
    assert.equal(c.get("k"), "v");
  });

  test("evicts expired entries", async () => {
    const c = new SafeMemoryCache<string>(5, 10);
    c.set("k", "v");
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(c.get("k"), undefined);
  });

  test("evicts oldest when over max size", () => {
    const c = new SafeMemoryCache<string>(10_000, 2);
    c.set("a", "1");
    c.set("b", "2");
    c.set("c", "3");
    assert.equal(c.get("a"), undefined);
    assert.equal(c.get("b"), "2");
    assert.equal(c.get("c"), "3");
  });
});
