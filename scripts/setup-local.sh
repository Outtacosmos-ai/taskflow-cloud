#!/usr/bin/env bash
# scripts/setup-local.sh
# One-shot local development setup script.
# Usage: ./scripts/setup-local.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info()  { echo "[INFO]  $*"; }
error() { echo "[ERROR] $*" >&2; }

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 is required but not installed. Please install it and re-run."
    exit 1
  fi
}

# ── Prerequisites ──────────────────────────────────────────────────────────────
info "Checking prerequisites…"
check_tool node
check_tool npm
check_tool docker

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  error "Node.js 20+ is required (found $(node --version))."
  exit 1
fi

# ── Environment files ──────────────────────────────────────────────────────────
info "Creating .env files from templates (skip if already exists)…"
for service in frontend backend worker; do
  if [[ ! -f "$ROOT_DIR/$service/.env" ]]; then
    cp "$ROOT_DIR/$service/.env.example" "$ROOT_DIR/$service/.env"
    info "  Created $service/.env — please fill in the values."
  else
    info "  $service/.env already exists, skipping."
  fi
done

# ── Install dependencies ───────────────────────────────────────────────────────
info "Installing dependencies…"
for service in frontend backend worker; do
  info "  npm ci in $service/"
  (cd "$ROOT_DIR/$service" && npm ci)
done

info "Setup complete! Run 'docker compose up --build' to start all services."
