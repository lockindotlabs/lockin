#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# BLACK-BOX TEST FLOW — Settings Sync (Extension ↔ Web ↔ API)
#
# Treats GET/PATCH /api/settings purely as input → output (no source inspection).
# Verifies the Phase 2 contract: extension settings persist correctly through
# the API and round-trip exactly as written.
#
# USAGE
#   1. Get an auth token (pick ONE):
#        a) Web/Clerk JWT — open the app in browser, devtools console:
#             await window.Clerk.session.getToken()
#        b) Extension token — Settings → "Connect extension" in the web app,
#           or read it from chrome://extensions → LockIn → storage (apiToken)
#   2. export TOKEN="<paste token here>"
#   3. export API_BASE="http://localhost:3001"   # optional, defaults below
#   4. bash apps/api/test/settings-sync.blackbox.sh
#
# Each test prints PASS/FAIL with the observed response. Nothing here mutates
# data destructively — TC9 restores the original settings at the end.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
TOKEN="${TOKEN:-}"
ENDPOINT="$API_BASE/api/settings"
PASS=0
FAIL=0

note()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
pass()  { printf '  \033[1;32m✓ PASS\033[0m — %s\n' "$1"; PASS=$((PASS+1)); }
fail()  { printf '  \033[1;31m✗ FAIL\033[0m — %s\n' "$1"; FAIL=$((FAIL+1)); }

req() {  # method path body
  local method="$1" body="${2:-}"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$ENDPOINT" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d "$body" -w '\n%{http_code}'
  else
    curl -sS -X "$method" "$ENDPOINT" \
      -H "Authorization: Bearer $TOKEN" -w '\n%{http_code}'
  fi
}

split_status() { tail -n1; }       # extract trailing status code line
split_body()   { sed '$d'; }       # drop the trailing status code line

field() { # body fieldname  -> prints JSON field value via node (no jq dependency)
  node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const p='$2'.split('.');let v=d;for(const k of p)v=v?.[k];console.log(typeof v==='object'?JSON.stringify(v):v)}catch(e){console.log('<parse-error>')}" <<< "$1"
}

# ─── TC0: token present? ─────────────────────────────────────────────────────
if [[ -z "$TOKEN" ]]; then
  echo "✗ TOKEN env var not set. See header comment for how to obtain one." >&2
  exit 1
fi

# ═════════════════════════════════════════════════════════════════════════════
note "TC1 — GET without Authorization header → expect 401 Unauthorized"
RESP=$(curl -sS -X GET "$ENDPOINT" -w '\n%{http_code}')
STATUS=$(echo "$RESP" | split_status)
[[ "$STATUS" == "401" ]] && pass "got 401 (status=$STATUS)" || fail "expected 401, got $STATUS — body: $(echo "$RESP" | split_body)"

# ═════════════════════════════════════════════════════════════════════════════
note "TC2 — GET with valid token → expect 200 + settings object (auto-creates defaults)"
RESP=$(req GET)
STATUS=$(echo "$RESP" | split_status)
BODY=$(echo "$RESP" | split_body)
ORIGINAL="$BODY"   # keep for TC9 restore
if [[ "$STATUS" == "200" ]]; then
  SUCCESS=$(field "$BODY" "success")
  [[ "$SUCCESS" == "true" ]] && pass "200 + success:true" || fail "200 but success=$SUCCESS — body: $BODY"
  echo "    current settings: $(field "$BODY" "data")"
else
  fail "expected 200, got $STATUS — body: $BODY"
fi

# ═════════════════════════════════════════════════════════════════════════════
note "TC3 — PATCH with full extension-settings payload → expect 200 + echoed values"
PAYLOAD='{
  "blocklistHard": ["facebook.com","reddit.com"],
  "blocklistSoft": ["youtube.com"],
  "hudStyle": "tiny",
  "reminderStyle": "modal",
  "blockTone": "accountability",
  "popupView": "compact",
  "defaultDuration": 50,
  "tabGuard": true
}'
RESP=$(req PATCH "$PAYLOAD")
STATUS=$(echo "$RESP" | split_status)
BODY=$(echo "$RESP" | split_body)
if [[ "$STATUS" == "200" ]]; then
  HUD=$(field "$BODY" "data.hudStyle")
  DUR=$(field "$BODY" "data.defaultDuration")
  GUARD=$(field "$BODY" "data.tabGuard")
  if [[ "$HUD" == "tiny" && "$DUR" == "50" && "$GUARD" == "true" ]]; then
    pass "PATCH echoed updated values (hudStyle=$HUD, defaultDuration=$DUR, tabGuard=$GUARD)"
  else
    fail "values not echoed correctly — body: $BODY"
  fi
else
  fail "expected 200, got $STATUS — body: $BODY"
fi

# ═════════════════════════════════════════════════════════════════════════════
note "TC4 — GET again → expect persisted values match what TC3 wrote (round-trip)"
RESP=$(req GET)
STATUS=$(echo "$RESP" | split_status)
BODY=$(echo "$RESP" | split_body)
HARD=$(field "$BODY" "data.blocklistHard")
SOFT=$(field "$BODY" "data.blocklistSoft")
TONE=$(field "$BODY" "data.blockTone")
if [[ "$HARD" == '["facebook.com","reddit.com"]' && "$SOFT" == '["youtube.com"]' && "$TONE" == "accountability" ]]; then
  pass "round-trip OK — blocklistHard=$HARD, blockTone=$TONE"
else
  fail "round-trip mismatch — blocklistHard=$HARD blocklistSoft=$SOFT blockTone=$TONE"
fi

# ═════════════════════════════════════════════════════════════════════════════
note "TC5 — PATCH with invalid enum (hudStyle: 'neon') → expect 400 validation error"
RESP=$(req PATCH '{"hudStyle":"neon"}')
STATUS=$(echo "$RESP" | split_status)
[[ "$STATUS" == "400" ]] && pass "got 400 (status=$STATUS)" || fail "expected 400, got $STATUS — body: $(echo "$RESP" | split_body)"

# ═════════════════════════════════════════════════════════════════════════════
note "TC6 — PATCH with out-of-range defaultDuration (1000 > max 480) → expect 400"
RESP=$(req PATCH '{"defaultDuration":1000}')
STATUS=$(echo "$RESP" | split_status)
[[ "$STATUS" == "400" ]] && pass "got 400 (status=$STATUS)" || fail "expected 400, got $STATUS — body: $(echo "$RESP" | split_body)"

# ═════════════════════════════════════════════════════════════════════════════
note "TC7 — PATCH partial payload (only theme) → expect ONLY theme changes, rest untouched"
RESP=$(req PATCH '{"theme":"dark"}')
STATUS=$(echo "$RESP" | split_status)
BODY=$(echo "$RESP" | split_body)
THEME=$(field "$BODY" "data.theme")
HUD_AFTER=$(field "$BODY" "data.hudStyle")
if [[ "$THEME" == "dark" && "$HUD_AFTER" == "tiny" ]]; then
  pass "partial update isolated correctly (theme=dark, hudStyle still tiny)"
else
  fail "partial update bled into other fields — theme=$THEME hudStyle=$HUD_AFTER"
fi

# ═════════════════════════════════════════════════════════════════════════════
note "TC8 — PATCH with empty body {} → expect 200, no fields change (no-op)"
RESP=$(req PATCH '{}')
STATUS=$(echo "$RESP" | split_status)
BODY=$(echo "$RESP" | split_body)
HUD_NOOP=$(field "$BODY" "data.hudStyle")
[[ "$STATUS" == "200" && "$HUD_NOOP" == "tiny" ]] && pass "empty PATCH is safe no-op" || fail "empty PATCH changed state — status=$STATUS hudStyle=$HUD_NOOP"

# ═════════════════════════════════════════════════════════════════════════════
note "TC9 — restore original settings (cleanup) so this run doesn't leave test data behind"
ORIG_DATA=$(field "$ORIGINAL" "data")
if [[ "$ORIG_DATA" != "<parse-error>" && -n "$ORIG_DATA" ]]; then
  RESTORE=$(node -e "
    const o = JSON.parse(process.argv[1]);
    const keep = ['theme','language','blocklistHard','blocklistSoft','hudStyle','reminderStyle','blockTone','popupView','defaultDuration','tabGuard'];
    const out = {};
    for (const k of keep) if (k in o) out[k] = o[k];
    console.log(JSON.stringify(out));
  " "$ORIG_DATA")
  RESP=$(req PATCH "$RESTORE")
  STATUS=$(echo "$RESP" | split_status)
  [[ "$STATUS" == "200" ]] && pass "original settings restored" || fail "restore failed — status=$STATUS"
else
  fail "could not parse original settings — manual cleanup may be needed"
fi

# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo "─────────────────────────────────────────────"
printf 'RESULT: \033[1;32m%d passed\033[0m, \033[1;31m%d failed\033[0m\n' "$PASS" "$FAIL"
echo "─────────────────────────────────────────────"
[[ "$FAIL" -eq 0 ]] && exit 0 || exit 1
