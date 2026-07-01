import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type } from "typebox";
import { loadConfig } from "./config.js";

export function registerExtractTool(pi: ExtensionAPI): void {
  pi.registerTool({
    name: "web_fetch",
    label: "Fetch URL",
    description:
      "Fetch a URL and extract readable content as markdown. Handles GitHub repos, YouTube videos, PDFs, and regular web pages. Use after web_search to read full page content.",
    promptGuidelines: [
      "Use web_fetch after web_search to read full page content when snippets are insufficient.",
      "Use web_fetch when the user provides a URL directly.",
      "Use web_fetch to verify specific claims from original sources.",
    ],
    parameters: Type.Object({
      url: Type.String({ description: "The URL to fetch. Must start with http:// or https://." }),
      prompt: Type.Optional(
        Type.String({
          description: "Question to ask about the page content (improves relevance for YouTube/videos).",
        }),
      ),
    }),

    async execute(_toolCallId, params) {
      const config = loadConfig();
      const url = params.url;

      try {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; PiAllSearch/1.0)",
            Accept: "text/html,application/json,application/markdown,text/plain,*/*",
          },
        });

        if (!resp.ok) {
          return {
            content: [{ type: "text", text: `Failed to fetch ${url}: ${resp.status} ${resp.statusText}` }],
            details: { error: `HTTP ${resp.status}` },
          };
        }

        const contentType = resp.headers.get("content-type") ?? "";
        const text = await resp.text();

        let content: string;
        if (contentType.includes("application/json")) {
          try {
            const json = JSON.parse(text);
            content = "```json\n" + JSON.stringify(json, null, 2) + "\n```";
          } catch {
            content = text.slice(0, 50000);
          }
        } else if (contentType.includes("text/html")) {
          content = htmlToMarkdown(text);
        } else {
          content = text.slice(0, 50000);
        }

        return {
          content: [{ type: "text", text: content }],
          details: { url, contentType, length: content.length },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error fetching ${url}: ${err instanceof Error ? err.message : String(err)}` }],
          details: { error: err instanceof Error ? err.message : String(err) },
        };
      }
    },

    renderCall(args, theme) {
      const url = (args.url as string) ?? "";
      const display = url.length > 60 ? `${url.slice(0, 57)}...` : url;
      return new Text(theme.fg("toolTitle", theme.bold("Fetch ")) + theme.fg("accent", display), 0, 0);
    },

    renderResult(result, { isPartial }, theme) {
      if (isPartial) return new Text(theme.fg("warning", "Fetching..."), 0, 0);
      const d = result.details as { error?: string; length?: number } | undefined;
      if (d?.error) return new Text(theme.fg("error", d.error), 0, 0);
      const len = d?.length ?? 0;
      return new Text(theme.fg("success", `✓ ${len} chars fetched`), 0, 0);
    },
  });
}

function htmlToMarkdown(html: string): string {
  let md = html;

  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");

  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");

  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<ul[^>]*>/gi, "\n");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<ol[^>]*>/gi, "\n");
  md = md.replace(/<\/ol>/gi, "\n");

  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gis, "```\n$1\n```\n\n");

  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<div[^>]*>(.*?)<\/div>/gi, "$1\n");

  md = md.replace(/<[^>]+>/g, "");

  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, " ");

  md = md.replace(/\n{3,}/g, "\n\n");
  md = md.trim();

  return md.slice(0, 50000);
}
