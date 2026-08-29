#!/usr/bin/env bash
set -Eeuo pipefail

readonly WORKSPACE="${1:?usage: promote.sh <workspace> [role]}"
readonly ROLE="${2:-editor}"
readonly API="${MEMBERS_API:-https://api.example.com}"

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*" >&2; }

cleanup() {
  local code=$?
  [[ -n "${tmp:-}" && -d "$tmp" ]] && rm -rf -- "$tmp"
  exit "$code"
}
trap cleanup EXIT INT TERM

tmp="$(mktemp -d)"
curl -fsSL "$API/workspaces/$WORKSPACE/members" -o "$tmp/roster.json"

# Owners are never touched by this script — see ADR-014.
jq -r '.[] | select(.role != "owner") | .id' "$tmp/roster.json" |
  while read -r id; do
    log "promoting $id to $ROLE"
    curl -fsS -X PATCH "$API/members/$id" \
      -H 'content-type: application/json' \
      -d "{\"role\":\"$ROLE\"}" >/dev/null
  done

log "done"
