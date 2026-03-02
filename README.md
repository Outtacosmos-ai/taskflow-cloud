# TaskFlow Cloud

> Cloud-native task management platform — AWS DevOps certification project demonstrating complete CI/CD, Infrastructure as Code, and container orchestration.

[![CI](https://github.com/Outtacosmos-ai/taskflow-cloud/actions/workflows/ci.yml/badge.svg)](https://github.com/Outtacosmos-ai/taskflow-cloud/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Kubernetes (EKS)](#kubernetes-eks)
- [Terraform Infrastructure](#terraform-infrastructure)
- [CI/CD Pipelines](#cicd-pipelines)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   MongoDB   │
│  React/Vite │     │  Express API│     │  (Atlas /   │
│  TailwindCSS│     │  Node 20    │     │   ECS)      │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │ SQS
                    ┌──────▼──────┐
                    │   Worker    │
                    │ SQS Consumer│
                    │ Nodemailer  │
                    └─────────────┘
```

All services are containerised and deployed to **AWS EKS** via GitHub Actions.

---

## Repository Structure

```
taskflow-cloud/
├── frontend/          # React 18 + Vite + TailwindCSS SPA
├── backend/           # Node.js 20 + Express REST API
├── worker/            # Node.js SQS consumer (async notifications)
├── k8s/               # Kubernetes manifests (EKS)
│   ├── base/          # Base manifests (Deployment, Service, Ingress)
│   └── overlays/      # Environment-specific patches (dev / prod)
├── terraform/         # Infrastructure as Code
│   ├── modules/       # Reusable Terraform modules
│   └── environments/  # dev / prod root modules
├── .github/workflows/ # GitHub Actions CI/CD pipelines
├── docs/              # Architecture diagrams and ADRs
├── scripts/           # Utility & deployment scripts
├── .gitignore
├── .pre-commit-config.yaml
├── LICENSE
└── README.md          # ← you are here
```

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 18, Vite, TailwindCSS, Axios, React Router v6 |
| Backend        | Node.js 20, Express, Mongoose, Winston, CORS |
| Worker         | Node.js 20, AWS SDK v3 (SQS), Nodemailer |
| Database       | MongoDB (Atlas or self-hosted)      |
| Message Queue  | AWS SQS                             |
| Container      | Docker (multi-stage builds)         |
| Orchestration  | Kubernetes / AWS EKS                |
| IaC            | Terraform (AWS provider)            |
| CI/CD          | GitHub Actions                      |
| Secrets        | AWS Secrets Manager                 |

---

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- AWS CLI v2 (configured with appropriate IAM permissions)
- `kubectl` + `helm`
- Terraform 1.7+

---

## Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/Outtacosmos-ai/taskflow-cloud.git
cd taskflow-cloud

# 2. Copy and fill environment variable templates
cp frontend/.env.example  frontend/.env
cp backend/.env.example   backend/.env
cp worker/.env.example    worker/.env

# 3. Install dependencies
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
cd worker   && npm install && cd ..

# 4. Start all services with Docker Compose
docker compose up --build
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

---

## Environment Variables

Each service ships with an `.env.example` file that lists every required variable.
**Never** commit real secrets — use AWS Secrets Manager in production.

| Service  | Template file              |
|----------|----------------------------|
| Frontend | `frontend/.env.example`    |
| Backend  | `backend/.env.example`     |
| Worker   | `worker/.env.example`      |

---

## Docker Compose

```bash
docker compose up --build          # start all services
docker compose down -v             # stop and remove volumes
docker compose logs -f backend     # follow backend logs
```

---

## Kubernetes (EKS)

```bash
# Apply base manifests
kubectl apply -k k8s/overlays/dev

# Check rollout status
kubectl rollout status deployment/backend -n taskflow
```

See [`k8s/README.md`](k8s/README.md) for detailed deployment instructions.

---

## Terraform Infrastructure

```bash
cd terraform/environments/dev
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

See [`terraform/README.md`](terraform/README.md) for module documentation.

---

## CI/CD Pipelines

| Workflow file                      | Trigger              | Action                            |
|------------------------------------|----------------------|-----------------------------------|
| `.github/workflows/ci.yml`         | PR to `main`         | Lint, test, build Docker images   |
| `.github/workflows/deploy-dev.yml` | Push to `develop`    | Deploy to dev EKS cluster         |
| `.github/workflows/deploy-prod.yml`| Push to `main`       | Deploy to prod EKS cluster        |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please run `pre-commit run --all-files` before submitting.

---

## License

[MIT](LICENSE) © 2024 TaskFlow Cloud Contributors

