#!/bin/bash
# Test pi-all-search extension
set -e

echo "=== Testing pi-all-search ==="

# Test 1: Config file exists
if [ -f config.json ]; then
  echo "✓ Config file exists"
else
  echo "✗ Config file missing"
  exit 1
fi

# Test 2: API keys in environment
if [ -n "$EXA_API_KEY" ] || [ -n "$TAVILY_API_KEY" ] || [ -n "$ANYSEARCH_API_KEY" ]; then
  echo "✓ API keys configured (env vars)"
elif grep -q "apiKey" config.json 2>/dev/null; then
  echo "✓ API keys configured (config file)"
else
  echo "⚠ No API keys found (search will use fallback)"
fi

# Test 3: Extension files exist
cd /Users/slahser/Desktop/usaslahser/pi-all-search
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

echo "=== pi-all-search tests passed ==="
