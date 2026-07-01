#!/bin/bash
# Test pi-all-search extension
set -e

echo "=== Testing pi-all-search ==="

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_PATH="$HOME/.pi/agent/extensions/pi-all-search/config.json"

# Test 1: Config file exists
if [ -f "$CONFIG_PATH" ]; then
  echo "✓ Config file exists"
else
  echo "✗ Config file missing"
  exit 1
fi

# Test 2: API keys in environment
if [ -n "$EXA_API_KEY" ] || [ -n "$TAVILY_API_KEY" ] || [ -n "$ANYSEARCH_API_KEY" ]; then
  echo "✓ API keys configured (env vars)"
elif grep -q "apiKey" "$CONFIG_PATH" 2>/dev/null; then
  echo "✓ API keys configured (config file)"
else
  echo "⚠ No API keys found (search will use fallback)"
fi

# Test 3: Extension files exist
cd "$SCRIPT_DIR"
if [ -f "extensions/index.ts" ] && [ -f "src/web-search.ts" ] && [ -f "src/extract.ts" ]; then
  echo "✓ Extension files exist"
else
  echo "✗ Extension files missing"
  exit 1
fi

# Test 4: Provider files exist
for provider in exa tavily anysearch firecrawl context7; do
  if [ -f "src/providers/${provider}.ts" ]; then
    echo "✓ Provider ${provider} exists"
  else
    echo "✗ Provider ${provider} missing"
    exit 1
  fi
done

# Test 5: web_fetch returns Pi text blocks (not { type, content })
if grep -q 'content: \[{ type: "text", text: content }\]' src/extract.ts; then
  echo "✓ web_fetch success path uses text field"
else
  echo "✗ web_fetch must return { type: \"text\", text: ... }"
  exit 1
fi
if grep -q 'content: \[{ type: "text", content }\]' src/extract.ts; then
  echo "✗ web_fetch still uses invalid content field on text blocks"
  exit 1
fi

echo "=== pi-all-search tests passed ==="
