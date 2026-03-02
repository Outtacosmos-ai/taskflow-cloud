# ADR-001: Use EKS for Container Orchestration

## Status

Accepted

## Context

TaskFlow Cloud needs a scalable container orchestration platform that integrates well with the AWS ecosystem and supports standard Kubernetes tooling for the DevOps certification project.

## Decision

Use **AWS Elastic Kubernetes Service (EKS)** with managed node groups.

## Consequences

**Positive:**
- Standard Kubernetes API — portable manifests
- Managed control plane reduces operational burden
- Native AWS IAM integration for IRSA
- Supports Kustomize overlays for environment management

**Negative:**
- Higher cost compared to ECS Fargate for simple workloads
- More complex initial setup
