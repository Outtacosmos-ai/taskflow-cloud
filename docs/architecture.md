# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Cloud                                    │
│                                                                     │
│  ┌─────────────┐    ┌─────────────────────────────────────────┐   │
│  │  Route 53   │    │              AWS EKS Cluster            │   │
│  │  (DNS)      │───▶│                                         │   │
│  └─────────────┘    │  ┌──────────┐  ┌──────────┐           │   │
│                     │  │ Frontend │  │ Backend  │           │   │
│  ┌─────────────┐    │  │ (nginx)  │  │(Express) │           │   │
│  │  CloudFront │    │  └──────────┘  └────┬─────┘           │   │
│  │  (CDN)      │    │                     │                  │   │
│  └─────────────┘    │  ┌──────────┐       │                  │   │
│                     │  │  Worker  │◀──────┤ SQS              │   │
│                     │  │(SQS Cons)│       │                  │   │
│                     │  └──────────┘       │                  │   │
│                     └─────────────────────┼─────────────────┘   │
│                                           │                      │
│  ┌─────────────┐    ┌─────────────┐       │                      │
│  │  MongoDB    │◀───│  VPC        │◀──────┘                      │
│  │  (Atlas or  │    │  Private    │                              │
│  │  DocumentDB)│    │  Subnet     │                              │
│  └─────────────┘    └─────────────┘                              │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐                              │
│  │  AWS SQS    │    │  Secrets    │                              │
│  │  Queue      │    │  Manager    │                              │
│  └─────────────┘    └─────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. Users access the **Frontend** SPA through CloudFront/ALB
2. The Frontend calls the **Backend** REST API
3. The Backend writes tasks to **MongoDB** and publishes events to **AWS SQS**
4. The **Worker** polls SQS and sends email notifications via Nodemailer
5. Sensitive configuration is stored in **AWS Secrets Manager**

## Network Design

- Public subnets: ALB, NAT Gateway
- Private subnets: EKS worker nodes, MongoDB
- All inter-service traffic stays within the VPC

## Security

- OIDC-based GitHub Actions auth (no static AWS keys in CI)
- Kubernetes secrets sourced from AWS Secrets Manager via External Secrets Operator
- Container images run as non-root users
- Network policies restrict pod-to-pod communication
