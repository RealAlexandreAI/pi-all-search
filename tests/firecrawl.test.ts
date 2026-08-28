import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import { FirecrawlProvider } from "../src/providers/firecrawl.js";
import { createAvailableProviders } from "../src/providers/index.js";

function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...(headers as Record<string, string>) };
}

describe("createAvailableProviders firecrawl keyless", () => {
  test("registers firecrawl when no FIRECRAWL_API_KEY", () => {
    const providers = createAvailableProviders({});
    assert.equal(providers.has("firecrawl"), true);
    assert.equal(providers.get("firecrawl")!.name, "firecrawl");
  });

  test("does not register other providers without keys", () => {
    const providers = createAvailableProviders({});
    assert.equal(providers.has("exa"), false);
    assert.equal(providers.has("tavily"), false);
    assert.equal(providers.has("anysearch"), false);
    assert.equal(providers.has("firecrawl-dev"), false);
    assert.equal(providers.has("context7"), false);
  });

  test("still registers keyed providers alongside keyless firecrawl", () => {
    const providers = createAvailableProviders({ exa: "exa-test-key" });
    assert.equal(providers.has("exa"), true);
    assert.equal(providers.has("firecrawl"), true);
    assert.equal(providers.has("tavily"), false);
  });
});

describe("FirecrawlProvider Authorization header", () => {
  test("omits Authorization when api key is missing", async () => {
    let captured: RequestInit | undefined;
    const fetchMock = mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured = init;
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    try {
      await new FirecrawlProvider().search("openai", 1);
      const headers = headerRecord(captured?.headers);
      const names = Object.keys(headers).map((k) => k.toLowerCase());
      assert.equal(names.includes("authorization"), false);
      assert.equal(headers.Authorization, undefined);
      assert.equal(headers.authorization, undefined);
    } finally {
      fetchMock.mock.restore();
    }
  });

  test("omits Authorization when api key is empty", async () => {
    let captured: RequestInit | undefined;
    const fetchMock = mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured = init;
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    try {
      await new FirecrawlProvider("").search("openai", 1);
      const headers = headerRecord(captured?.headers);
      const names = Object.keys(headers).map((k) => k.toLowerCase());
      assert.equal(names.includes("authorization"), false);
    } finally {
      fetchMock.mock.restore();
    }
  });

  test("sets Authorization Bearer when api key is present", async () => {
    let captured: RequestInit | undefined;
    const fetchMock = mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured = init;
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    try {
      await new FirecrawlProvider("fc-test-key").search("openai", 1);
      const headers = headerRecord(captured?.headers);
      assert.equal(headers.Authorization, "Bearer fc-test-key");
    } finally {
      fetchMock.mock.restore();
    }
  });

  test("posts to v1/search", async () => {
    let url: RequestInfo | URL | undefined;
    const fetchMock = mock.method(globalThis, "fetch", async (input: RequestInfo | URL, _init?: RequestInit) => {
      url = input;
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    try {
      await new FirecrawlProvider().search("openai", 1);
      assert.equal(String(url), "https://api.firecrawl.dev/v1/search");
    } finally {
      fetchMock.mock.restore();
    }
  });
});
