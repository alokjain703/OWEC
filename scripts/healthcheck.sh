#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# OMNI Health Check
# Usage:  ./scripts/healthcheck.sh [--wait] [--timeout 60]
#
# Flags:
#   --wait          Keep retrying until all services are healthy (default: 1 try)
#   --timeout N     Seconds to keep retrying when --wait is set  (default: 60)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
WAIT=false
TIMEOUT=60
DB_CONTAINER="omni-postgres"
BACKEND_URL="http://localhost:8052/health"
FRONTEND_URL="http://localhost:4252"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

# ── Arg parsing ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --wait)    WAIT=true; shift ;;
    --timeout) TIMEOUT="$2"; shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
pass() { echo -e "  ${GREEN}✔${RESET} $1"; }
fail() { echo -e "  ${RED}✖${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; }
info() { echo -e "  ${CYAN}→${RESET} $1"; }

check_db() {
  if docker inspect "$DB_CONTAINER" &>/dev/null && \
     docker exec "$DB_CONTAINER" pg_isready -U omni -d omni_db -q 2>/dev/null; then
    pass "Database  (omni-postgres) is accepting connections"
    return 0
  fi
  fail "Database  (omni-postgres) is NOT ready"
  return 1
}

check_backend() {
  local resp http_code body
  resp=$(curl -sf --max-time 5 -w "\n%{http_code}" "$BACKEND_URL" 2>/dev/null) || true
  http_code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')

  if [[ "$http_code" == "200" ]]; then
    local ts; ts=$(echo "$body" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4 || echo "")
    pass "Backend   ($BACKEND_URL) → HTTP $http_code${ts:+  [$ts]}"

    # Check for ERROR/CRITICAL lines in last 50 log lines
    local errors; errors=$(docker logs omni-backend --tail 50 2>&1 | grep -cE " ERROR | CRITICAL " || true)
    if [[ "$errors" -gt 0 ]]; then
      warn "Backend logs contain $errors error line(s) — run: make logs-backend"
    fi
    return 0
  fi
  fail "Backend   ($BACKEND_URL) → HTTP ${http_code:-unreachable}"
  # Print last 5 error lines to help diagnose
  docker logs omni-backend --tail 20 2>&1 | grep -E " ERROR | CRITICAL |Exception|Error:" | tail -5 | while IFS= read -r line; do
    info "$line"
  done || true
  return 1
}

check_frontend() {
  local http_code
  http_code=$(curl -sf --max-time 5 -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null) || true

  if [[ "$http_code" == "200" ]]; then
    pass "Frontend  ($FRONTEND_URL) → HTTP $http_code"

    # Check Angular build output for "error" in logs
    local build_errors; build_errors=$(docker logs omni-frontend --tail 80 2>&1 | grep -ciE "^.*\[error\]|Error:|error TS" || true)
    if [[ "$build_errors" -gt 0 ]]; then
      warn "Frontend build log contains $build_errors potential error line(s) — run: make logs-frontend"
      docker logs omni-frontend --tail 80 2>&1 | grep -iE "\[error\]|Error:|error TS" | tail -5 | while IFS= read -r line; do
        info "$line"
      done || true
    fi
    return 0
  fi
  fail "Frontend  ($FRONTEND_URL) → HTTP ${http_code:-unreachable}"
  docker logs omni-frontend --tail 20 2>&1 | grep -iE "error|ERROR" | tail -5 | while IFS= read -r line; do
    info "$line"
  done || true
  return 1
}

# ── Run checks (once or with retry) ──────────────────────────────────────────
run_all_checks() {
  local ok=0 fail_count=0
  if check_db;       then ok=$((ok + 1)); else fail_count=$((fail_count + 1)); fi
  if check_backend;  then ok=$((ok + 1)); else fail_count=$((fail_count + 1)); fi
  if check_frontend; then ok=$((ok + 1)); else fail_count=$((fail_count + 1)); fi
  echo ""
  if [[ $fail_count -eq 0 ]]; then
    echo -e "${BOLD}${GREEN}All $((ok)) checks passed.${RESET}"
    return 0
  else
    echo -e "${BOLD}${RED}$fail_count check(s) failed${RESET} ($ok passed)"
    return 1
  fi
}

echo ""
echo -e "${BOLD}${CYAN}OMNI Health Check${RESET}"
echo -e "  $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [[ "$WAIT" == "false" ]]; then
  run_all_checks
  exit $?
fi

# ── Wait / retry mode ─────────────────────────────────────────────────────────
echo -e "  Waiting up to ${TIMEOUT}s for all services to become healthy…"
echo ""
START=$(date +%s)
INTERVAL=3
while true; do
  if run_all_checks; then
    exit 0
  fi
  ELAPSED=$(( $(date +%s) - START ))
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo ""
    echo -e "${RED}Timed out after ${TIMEOUT}s.${RESET}"
    exit 1
  fi
  echo ""
  echo -e "  ${YELLOW}Retrying in ${INTERVAL}s… (${ELAPSED}s elapsed)${RESET}"
  echo ""
  sleep $INTERVAL
done
