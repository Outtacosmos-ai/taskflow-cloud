#!/usr/bin/env bash
# scripts/build-images.sh
# Build and optionally push Docker images.
# Usage: ./scripts/build-images.sh [--push] [--registry <registry>] [--tag <tag>]

set -euo pipefail

PUSH=false
REGISTRY=""
TAG="${GITHUB_SHA:-local}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push)      PUSH=true; shift ;;
    --registry)  REGISTRY="$2"; shift 2 ;;
    --tag)       TAG="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info() { echo "[INFO]  $*"; }

build_image() {
  local service="$1"
  local full_tag
  full_tag="${REGISTRY:+$REGISTRY/}taskflow-${service}:${TAG}"

  info "Building $full_tag"
  docker build --platform linux/amd64 -t "$full_tag" "$ROOT_DIR/$service"

  if [[ "$PUSH" == "true" ]]; then
    info "Pushing $full_tag"
    docker push "$full_tag"
  fi
}

build_image backend
build_image frontend
build_image worker

if [[ "$PUSH" == "true" ]]; then
  info "All images built and pushed."
else
  info "All images built."
fi
