# TaskFlow Cloud — Kubernetes Manifests

## Structure

```
k8s/
├── base/           # Base Kubernetes resources shared across environments
│   ├── namespace.yaml
│   ├── backend.yaml
│   ├── frontend.yaml
│   ├── worker.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/        # Development overrides (1 replica)
    └── prod/       # Production overrides (3 replicas, HPA)
```

## Prerequisites

- `kubectl` 1.27+
- `kustomize` 5+
- Access to the EKS cluster (`aws eks update-kubeconfig --name taskflow-eks --region us-east-1`)

## Deploy

```bash
# Development
kubectl apply -k k8s/overlays/dev

# Production
kubectl apply -k k8s/overlays/prod
```

## Secrets

Create secrets before deploying (or use External Secrets Operator with AWS Secrets Manager):

```bash
kubectl create secret generic backend-secrets \
  --from-env-file=backend/.env \
  -n taskflow

kubectl create secret generic worker-secrets \
  --from-env-file=worker/.env \
  -n taskflow
```
