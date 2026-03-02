#!/usr/bin/env bash
# scripts/deploy.sh
# Deploy to the specified environment.
# Usage: ./scripts/deploy.sh <dev|prod>

set -euo pipefail

ENV="${1:-}"

if [[ -z "$ENV" ]]; then
  echo "Usage: $0 <dev|prod>" >&2
  exit 1
fi

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Environment must be 'dev' or 'prod'" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info()  { echo "[INFO]  $*"; }
error() { echo "[ERROR] $*" >&2; }

check_tool() {
  if ! command -v "$1" &>/dev/null; then
    error "$1 is required but not installed."
    exit 1
  fi
}

check_tool kubectl
check_tool kustomize

EKS_CLUSTER="taskflow-${ENV}"
AWS_REGION="${AWS_REGION:-us-east-1}"

info "Updating kubeconfig for cluster: $EKS_CLUSTER"
aws eks update-kubeconfig --name "$EKS_CLUSTER" --region "$AWS_REGION"

info "Applying k8s/overlays/$ENV…"
kubectl apply -k "$ROOT_DIR/k8s/overlays/$ENV"

info "Waiting for rollouts to complete…"
kubectl rollout status deployment/backend  -n taskflow --timeout=5m
kubectl rollout status deployment/frontend -n taskflow --timeout=5m
kubectl rollout status deployment/worker   -n taskflow --timeout=5m

info "Deployment to $ENV complete!"
