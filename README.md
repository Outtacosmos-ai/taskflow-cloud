# TaskFlow Cloud

> Cloud-native task management platform — AWS DevOps certification project (Simplon DevOps & AWS Cloud, 2026) demonstrating the complete DevOps lifecycle: containerisation, Kubernetes orchestration, Infrastructure as Code, CI/CD automation, asynchronous processing, and observability.

[![CI](https://github.com/Outtacosmos-ai/taskflow-cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/Outtacosmos-ai/taskflow-cloud/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start — Local Development](#quick-start--local-development)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Docker Compose](#docker-compose)
- [Kubernetes (EKS)](#kubernetes-eks)
- [Terraform Infrastructure](#terraform-infrastructure)
- [CI/CD Pipelines](#cicd-pipelines)
- [Observability](#observability)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Architecture Decision Records](#architecture-decision-records)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview

```
                     ┌─────────────────────────────────┐
  Users              │           AWS EKS Cluster        │
    │                │  Namespace: taskflow             │
    │ HTTPS          │                                  │
    ▼                │  ┌────────────┐                  │
┌──────┐   ALB       │  │  Frontend  │ nginx:1.27-alpine│
│ IGW  │────────────▶│  │ React/Vite │ port 80          │
└──────┘             │  └─────┬──────┘                  │
                     │        │ API calls                │
                     │  ┌─────▼──────┐                  │
                     │  │  Backend   │ node:20-alpine    │
                     │  │ Express API│ port 3000         │
                     │  └─────┬──────┘                  │
                     │        │                         │
                     │   ┌────┴────┐                    │
                     │   │  SQS    │◀── AWS SQS         │
                     │   └────┬────┘                    │
                     │        │                         │
                     │  ┌─────▼──────┐                  │
                     │  │   Worker   │ SQS consumer      │
                     │  │ Nodemailer │ node:20-alpine    │
                     │  └────────────┘                  │
                     └──────────────┬──────────────────┘
                                    │
               ┌────────────────────┼──────────────────┐
               │                    │                  │
          ┌────▼────┐         ┌─────▼────┐      ┌──────▼──────┐
          │ MongoDB │         │ AWS SQS  │      │  Secrets    │
          │ EC2/priv│         │ + DLQ    │      │  Manager    │
          │ subnet  │         └──────────┘      └─────────────┘
          └─────────┘
```

### Data flow

1. Users reach the **Frontend** SPA served by nginx through an Application Load Balancer.
2. The Frontend calls the **Backend** REST API (JWT-authenticated).
3. The Backend writes tasks to **MongoDB** and publishes a message to **AWS SQS** (fire-and-forget — API never blocks on this).
4. The **Worker** long-polls SQS, processes messages, and sends email notifications via Nodemailer.
5. Failed messages (after 5 attempts) are moved to the **Dead Letter Queue** for inspection.
6. Sensitive configuration is stored in **AWS Secrets Manager**.

### Network design

```
VPC 10.0.0.0/16  (us-east-1)
├── Public subnets   10.0.1.0/24, 10.0.2.0/24   — ALB, NAT Gateway
└── Private subnets  10.0.11.0/24, 10.0.12.0/24 — EKS nodes, MongoDB EC2
```

---

## Repository Structure

```
taskflow-cloud/
├── .github/
│   └── workflows/
│       ├── ci.yml          # CI: lint → test → build → Trivy scan → ECR push
│       └── cd.yml          # CD: triggered on CI success → deploy to EKS + rollback
├── backend/                # Node.js 20 + Express REST API
│   ├── src/
│   │   ├── config/         # database.js, logger.js
│   │   ├── controllers/    # taskController.js
│   │   ├── middleware/     # auth.js (JWT)
│   │   ├── models/         # User.js, Task.js, Board.js
│   │   ├── routes/         # auth.js, boards.js, tasks.js, health.js
│   │   ├── services/       # sqsService.js
│   │   ├── app.js          # Express app + CORS + error handler
│   │   └── index.js        # Entry point — connects Mongoose, starts server
│   ├── Dockerfile          # Multi-stage, node:20-alpine, non-root user
│   └── .env.example
├── frontend/               # React 18 + Vite + TailwindCSS SPA
│   ├── src/
│   │   ├── api/            # client.js (Axios instance)
│   │   ├── components/     # ProtectedRoute.jsx
│   │   ├── context/        # AuthContext.jsx
│   │   ├── pages/          # Board.jsx, Dashboard.js, Login.jsx
│   │   └── services/       # api.js
│   ├── nginx.conf          # SPA fallback, security headers, /healthz
│   ├── Dockerfile          # Multi-stage: Vite build → nginx:1.27-alpine
│   └── .env.example
├── worker/                 # Node.js 20 SQS consumer
│   ├── src/
│   │   ├── index.js        # Long-poll loop, graceful SIGTERM/SIGINT shutdown
│   │   └── logger.js       # Console logger
│   ├── Dockerfile          # Multi-stage, node:20-alpine, non-root user
│   └── .env.example
├── k8s/
│   ├── base/               # Namespace, Deployments, Services, HPA, PVC, Worker
│   └── overlays/
│       ├── dev/            # Dev-specific patches (1 replica)
│       └── prod/           # Prod-specific patches (3 replicas)
├── terraform/
│   ├── modules/
│   │   ├── vpc/            # VPC, subnets, IGW, NAT GW, route tables
│   │   ├── eks/            # EKS cluster, node group, OIDC provider (IRSA)
│   │   ├── sqs/            # SQS queue + DLQ, redrive policy
│   │   ├── cloudwatch/     # Log group, metric filter, error-rate alarm
│   │   └── secretsmanager/ # Secrets Manager secret placeholders
│   └── environments/
│       ├── dev/            # Dev root module (main.tf, variables.tf, outputs.tf)
│       └── prod/           # Prod root module
├── docs/
│   ├── architecture.md     # ASCII architecture diagrams + data flow
│   └── adr/
│       ├── 001-use-eks.md
│       └── 002-use-sqs.md
├── scripts/
│   ├── setup-local.sh      # One-shot local dev setup (checks Node ≥20, copies .env)
│   ├── build-images.sh     # Build and tag all three Docker images
│   └── deploy.sh           # Manual deploy helper (kubectl set image)
├── .gitignore
├── .pre-commit-config.yaml # trailing-whitespace, detect-private-key, terraform_fmt, hadolint, commitizen
├── docker-compose.yml      # Local stack: mongodb, backend, frontend, worker
└── README.md
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18, Vite, TailwindCSS, Axios, React Router v6 | Served by nginx 1.27-alpine |
| Backend | Node.js 20, Express 4, Mongoose 8, bcryptjs, jsonwebtoken | Port 3000 |
| Worker | Node.js 20, AWS SDK v3 (`@aws-sdk/client-sqs`), Nodemailer | SQS long-polling |
| Database | MongoDB 7 (self-hosted on EC2 in dev) | Atlas or DocumentDB for production |
| Message queue | AWS SQS (standard queue) + Dead Letter Queue | `maxReceiveCount: 5` |
| Container | Docker — multi-stage builds, Alpine base, non-root user (UID 1001) | |
| Registry | Amazon ECR | Tagged with `latest` + git SHA |
| Orchestration | Kubernetes 1.30 / Amazon EKS | Kustomize overlays |
| IaC | Terraform 1.7+, AWS provider ~5.0 | 5 reusable modules |
| CI/CD | GitHub Actions | ci.yml + cd.yml |
| Secrets | AWS Secrets Manager (provisioned) | Not yet wired into K8s via ESO |
| Monitoring | Amazon CloudWatch Logs + metric filter + alarm | Fluent Bit not yet deployed |
| Security scan | Trivy (in CI) | `severity: CRITICAL` |
| Pre-commit | pre-commit-hooks, terraform_fmt, hadolint, commitizen | |

---

## Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 20.x LTS | https://nodejs.org |
| Docker | 24.x | https://docs.docker.com/get-docker |
| Docker Compose | v2 (bundled with Docker) | — |
| AWS CLI | 2.x | `./aws/install` (bundled) or https://aws.amazon.com/cli |
| kubectl | 1.30 | `aws eks update-kubeconfig ...` |
| Terraform | 1.7+ | https://developer.hashicorp.com/terraform/install |
| pre-commit | 3.x | `pip install pre-commit` |

---

## Quick Start — Local Development

```bash
# 1. Clone
git clone https://github.com/Outtacosmos-ai/taskflow-cloud.git
cd taskflow-cloud

# 2. Run the automated setup script (checks Node version, copies .env files, installs deps)
./scripts/setup-local.sh

# 3. Fill in secrets in each .env file (at minimum: JWT_SECRET, SQS_QUEUE_URL)
#    For local development, SQS calls are no-ops if the queue URL is a placeholder.

# 4. Start the full local stack
docker compose up --build
```

| Service | Local URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| MongoDB | mongodb://localhost:27017 |

To run a single service:

```bash
docker compose up --build backend
```

To reset all state (including the MongoDB volume):

```bash
docker compose down -v
```

---

## Environment Variables

Each service ships with a `.env.example` file. Copy it to `.env` and fill in the values. Never commit `.env` files — they are in `.gitignore`.

### Backend — `backend/.env.example`

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | Secret for signing JWTs — use a long random string | — |
| `JWT_EXPIRES_IN` | JWT expiry | `7d` |
| `AWS_REGION` | AWS region for SQS | `us-east-1` |
| `SQS_QUEUE_URL` | Full SQS queue URL | `https://sqs.us-east-1.amazonaws.com/...` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

### Frontend — `frontend/.env.example`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |
| `VITE_ENABLE_ANALYTICS` | Feature flag | `false` |

### Worker — `worker/.env.example`

| Variable | Description | Example |
|---|---|---|
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Leave blank on EC2/EKS with IAM role | — |
| `AWS_SECRET_ACCESS_KEY` | Leave blank on EC2/EKS with IAM role | — |
| `SQS_QUEUE_URL` | Full SQS queue URL | `https://sqs.us-east-1.amazonaws.com/...` |
| `SQS_VISIBILITY_TIMEOUT` | Seconds a message is hidden after receive | `30` |
| `SQS_WAIT_TIME_SECONDS` | Long-polling wait time | `20` |
| `SQS_MAX_MESSAGES` | Max messages per poll | `10` |
| `SMTP_HOST` | SMTP server for Nodemailer | `smtp.example.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `EMAIL_FROM` | Sender address | `TaskFlow Cloud <notifications@example.com>` |

> In Kubernetes (EKS), the Worker authenticates to SQS via the IRSA ServiceAccount (`taskflow-sa`) — no `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` needed.

---

## API Reference

Base URL: `http://localhost:3000/api`

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register a new user. Body: `{ name, email, password }`. Returns `{ token, user }`. |
| `POST` | `/auth/login` | None | Login. Body: `{ email, password }`. Returns `{ token, user }`. |

All other routes require `Authorization: Bearer <token>`.

### Tasks

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List all tasks for the authenticated user + stats |
| `POST` | `/tasks` | Create a task. Body: `{ title, description?, priority? }` |
| `PATCH` | `/tasks/:id` | Update `title`, `description`, or `priority` |
| `DELETE` | `/tasks/:id` | Delete a task |

### Boards

| Method | Path | Description |
|---|---|---|
| `GET` | `/boards` | Get the authenticated user's board (with columns and task order) |
| `PUT` | `/boards` | Update column task order (drag-and-drop) |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns `{ status: "ok", timestamp }` — used by K8s liveness probe |

---

## Docker Compose

The `docker-compose.yml` defines four services: `mongodb`, `backend`, `frontend`, `worker`.

```bash
# Start everything
docker compose up --build

# Follow logs for one service
docker compose logs -f backend

# Stop and remove volumes (resets MongoDB data)
docker compose down -v

# Run only the API and database
docker compose up mongodb backend
```

MongoDB health-checks run via `mongosh --eval "db.adminCommand('ping')"`. The backend waits for MongoDB to be healthy before starting (`depends_on: { mongodb: { condition: service_healthy } }`).

---

## Kubernetes (EKS)

### Cluster details (dev)

| Property | Value |
|---|---|
| Cluster name | `taskflow-dev` |
| Kubernetes version | 1.30 |
| Node type | `t3.medium` (configured via Terraform variables) |
| Node group scaling | min / desired / max set in `terraform.tfvars` |
| Namespace | `taskflow` |

### Manifests (`k8s/base/`)

| File | Resource |
|---|---|
| `namespace.yaml` | Namespace `taskflow` |
| `backend.yaml` | ServiceAccount (IRSA), Deployment, Service (ClusterIP) |
| `frontend-deployment.yaml` | Deployment (2 replicas), Service (LoadBalancer) |
| `frontend-service.yaml` | Service — exposes frontend via ALB |
| `worker.yaml` | Deployment (1 replica, SQS consumer) |
| `mongodb-deployment.yaml` | MongoDB Deployment (dev only) |
| `mongodb-pvc.yaml` | PersistentVolumeClaim for MongoDB data |
| `mongodb-service.yaml` | ClusterIP service for MongoDB |
| `hpa.yaml` | HorizontalPodAutoscaler — backend, min 2 / max 5 replicas, CPU 70% |
| `kustomization.yaml` | Kustomize root for base |

### Deploy to dev

```bash
# Authenticate kubectl against the dev cluster
aws eks update-kubeconfig --name taskflow-dev --region us-east-1

# Create secrets before first deploy (see Security Notes below)
kubectl create secret generic taskflow-backend-secret \
  --from-literal=jwt_secret=$(openssl rand -hex 32) \
  -n taskflow

# Apply with Kustomize
kubectl apply -k k8s/overlays/dev

# Watch rollout
kubectl rollout status deployment/taskflow-backend -n taskflow
kubectl rollout status deployment/taskflow-frontend -n taskflow

# Check pods
kubectl get pods -n taskflow

# View backend logs
kubectl logs -f deployment/taskflow-backend -n taskflow
```

### Rollback manually

```bash
kubectl rollout undo deployment/taskflow-backend -n taskflow
```

---

## Terraform Infrastructure

### Modules

| Module | What it provisions |
|---|---|
| `vpc` | VPC (`10.0.0.0/16`), 2 public + 2 private subnets, IGW, NAT Gateway, route tables |
| `eks` | EKS cluster, managed node group, OIDC provider for IRSA |
| `sqs` | Standard SQS queue + Dead Letter Queue, redrive policy (`maxReceiveCount: 5`, DLQ retention 14 days) |
| `cloudwatch` | CloudWatch log group (`/ecs/taskflow-cluster`), metric filter for ERROR pattern, high-error-rate alarm |
| `secretsmanager` | AWS Secrets Manager secret placeholders for backend and worker |

### First-time bootstrap (remote state — recommended)

> By default the dev environment uses local state. Before running in a team or CI context, configure remote state first.

```bash
# 1. Create S3 bucket for state
aws s3api create-bucket \
  --bucket taskflow-terraform-state-dev \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket taskflow-terraform-state-dev \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket taskflow-terraform-state-dev \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# 2. Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name taskflow-tf-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# 3. Add the backend block to terraform/environments/dev/main.tf (see Known Limitations)
```

### Provision dev infrastructure

```bash
cd terraform/environments/dev

# Copy and fill variable values
cp terraform.tfvars.example terraform.tfvars
# Edit: node_instance_type, node_desired_size, node_min_size, node_max_size

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Estimated provisioning time: ~15 minutes (EKS cluster creation dominates).

### Destroy

```bash
terraform destroy
```

---

## CI/CD Pipelines

Two GitHub Actions workflows run in sequence on the `main` branch.

### `ci.yml` — Continuous Integration

**Trigger:** Push to `main` or `develop`; pull requests targeting `main`

| Step | Detail |
|---|---|
| Lint | `npm run lint` (ESLint) across `frontend`, `backend`, `worker` in parallel via matrix |
| Test | `npm test` — currently uses `--passWithNoTests` (see Known Limitations) |
| Docker build | Multi-stage build for each service |
| Trivy scan | Scans each image for OS + library vulnerabilities at `CRITICAL` severity (`exit-code: 0` — see Known Limitations) |
| ECR push | Pushes `latest` + git SHA tag to Amazon ECR — only on `main` branch and only if all prior steps succeed |

### `cd.yml` — Continuous Deployment

**Trigger:** `ci.yml` workflow completes successfully on `main`

| Step | Detail |
|---|---|
| AWS auth | `aws-actions/configure-aws-credentials@v4` |
| kubeconfig | `aws eks update-kubeconfig` + `kubectl config use-context` |
| Deploy | `kubectl set image deployment/taskflow-<service> <service>=<ecr-image>:<sha>` |
| Rollout wait | `kubectl rollout status --timeout=3m` |
| Auto-rollback | `kubectl rollout undo` triggered automatically on `if: failure()` |

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user key for GitHub Actions (CI only — CD uses kubeconfig) |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret |

> Note: The cluster ARN and AWS account ID are currently hardcoded in `cd.yml`. Move these to repository variables or secrets before using in a shared environment.

---

## Observability

### CloudWatch (provisioned via Terraform)

| Resource | Details |
|---|---|
| Log group | `/ecs/taskflow-cluster`, 14-day retention |
| Metric filter | Pattern: `ERROR` → custom metric `TaskFlowMetrics/ErrorCount` |
| Alarm | `taskflow-high-error-rate` — fires when `ErrorCount > 10` in a 10-minute window |

### Current state vs target

| Capability | Status | Note |
|---|---|---|
| Structured JSON logs | Not yet | `logger.js` uses `console.log`; Winston is declared but not instantiated |
| Fluent Bit DaemonSet | Not yet | Pod logs do not currently reach CloudWatch |
| CloudWatch Dashboard | Not yet | Alarm exists; dashboard is not provisioned |
| ALB access logs | Not yet | |
| DLQ depth alarm | Not yet | |

### Viewing logs manually

```bash
# Backend logs via kubectl
kubectl logs -f deployment/taskflow-backend -n taskflow

# Worker logs
kubectl logs -f deployment/taskflow-worker -n taskflow

# CloudWatch Logs Insights (once Fluent Bit is deployed)
aws logs filter-log-events \
  --log-group-name /ecs/taskflow-cluster \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

## Security Notes

### Secrets management

- All application secrets (JWT, SMTP, MongoDB URI) must be provided via environment variables — never hardcoded in source.
- In Kubernetes, create secrets with `kubectl create secret generic` before first deploy (see [Deploy to dev](#deploy-to-dev) above).
- AWS Secrets Manager secrets (`taskflow/dev/backend`, `taskflow/dev/worker`) are provisioned by Terraform but are not yet automatically synced into Kubernetes Secrets. This requires the [External Secrets Operator](https://external-secrets.io) (not yet deployed).
- The Worker authenticates to SQS via IRSA (`taskflow-sa` ServiceAccount with an annotated IAM role) — no static credentials needed in Kubernetes.

### Container security

- All images run as a non-root user (`nodeapp`, UID 1001).
- Alpine Linux base images minimise the attack surface.
- Trivy scans run in CI for every image build (currently non-blocking — see Known Limitations).
- nginx security headers are set: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.

### Network security

- EKS nodes and MongoDB EC2 run in **private subnets** — no direct internet access.
- The MongoDB Security Group allows inbound on port `27017` only from within the VPC CIDR.
- Outbound internet access from private subnets goes through a NAT Gateway.

---

## Known Limitations

The following gaps exist in the current codebase relative to the full target architecture. They are documented here for transparency and are planned for the next sprint.

| # | Area | Limitation | Fix |
|---|---|---|---|
| 1 | Logging | `logger.js` wraps `console.log` — Winston is declared as a dependency but not used | Replace with a real Winston JSON logger |
| 2 | Observability | No Fluent Bit DaemonSet — pod logs do not reach CloudWatch | Add `k8s/base/fluent-bit.yaml` DaemonSet |
| 3 | Terraform state | Dev environment uses local state — `dev_migration.plan` is in the repo | Bootstrap S3 + DynamoDB backend (commands above) |
| 4 | K8s deployment strategy | Backend uses `Recreate` instead of `RollingUpdate` — causes ~15s downtime per deploy | Change `strategy.type` to `RollingUpdate`, `maxSurge: 1`, `maxUnavailable: 0` |
| 5 | CORS | CORS middleware reflects all origins without a whitelist | Replace with `cors` package + `CORS_ORIGINS` env variable |
| 6 | Testing | Zero test files — Jest/Supertest declared but `--passWithNoTests` hides the absence | Add auth middleware tests, API integration tests, SQS mock tests |
| 7 | Trivy | `exit-code: '0'` means CRITICAL vulnerabilities do not block the pipeline | Change to `exit-code: '1'` |
| 8 | Worker handler | `processMessage` contains a `TODO` — messages are received but email is not sent | Implement Nodemailer dispatch based on `body.type` |
| 9 | Secrets sync | Secrets Manager provisioned but not synced to Kubernetes (no External Secrets Operator) | Deploy ESO and add `ExternalSecret` manifests |
| 10 | CI/CD workflow table | README previously listed `deploy-dev.yml` / `deploy-prod.yml` — actual files are `ci.yml` and `cd.yml` | Corrected in this README |

---

## Architecture Decision Records

ADRs live in `docs/adr/`. Current records:

| ADR | Decision | Status |
|---|---|---|
| [001](docs/adr/001-use-eks.md) | Use EKS for container orchestration over ECS/Fargate | Accepted |
| [002](docs/adr/002-use-sqs.md) | Use SQS for async email notifications over synchronous sending | Accepted |

Planned ADRs: MongoDB on EC2 vs DocumentDB (cost trade-off), Recreate vs RollingUpdate deployment strategy, local vs remote Terraform state.

---

## Contributing

1. Fork the repository.
2. Install pre-commit hooks:
   ```bash
   pip install pre-commit
   pre-commit install --hook-type commit-msg
   ```
3. Create a feature branch: `git checkout -b feat/my-feature`
4. Make your changes. Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitizen hook).
5. Run pre-commit checks: `pre-commit run --all-files`
6. Push and open a Pull Request targeting `main`.

Pre-commit hooks run: trailing whitespace, YAML/JSON validation, merge-conflict detection, private-key detection, large-file check (>500 KB), `terraform fmt`, `terraform validate`, Hadolint (Dockerfile linting), and Conventional Commits message validation.

---

## License

[MIT](LICENSE) © 2026 Mohamed ESSRHIR — Simplon DevOps & AWS Cloud Certification Project