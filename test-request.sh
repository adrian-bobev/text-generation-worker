#!/bin/bash

# Test script for the Book Generation Worker
# Usage: ./test-request.sh [worker-url]

WORKER_URL="${1:-http://localhost:8787}"
API_KEY="${2:-}"

echo "🧪 Testing Book Generation Worker"
echo "📍 URL: $WORKER_URL"
echo ""

# Prepare headers
HEADERS=(
  -H "Content-Type: application/json"
  -H "Origin: http://localhost:3000"
)

if [ -n "$API_KEY" ]; then
  HEADERS+=(-H "X-API-Key: $API_KEY")
  echo "🔑 Using API Key"
fi

echo "📤 Sending request..."
echo ""

# Send request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WORKER_URL" \
  "${HEADERS[@]}" \
  -d '{
    "name": "Мария",
    "age": 5,
    "gender": "girl",
    "topic": "космос и звезди"
  }')

# Split response and status code
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

echo "📥 Response (HTTP $HTTP_CODE):"
echo ""

# Pretty print JSON if jq is available
if command -v jq &> /dev/null; then
  echo "$HTTP_BODY" | jq .
else
  echo "$HTTP_BODY"
fi

echo ""

# Check status
if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Success!"
else
  echo "❌ Request failed with status $HTTP_CODE"
  exit 1
fi

