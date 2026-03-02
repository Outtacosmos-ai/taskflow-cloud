# TaskFlow Cloud — Terraform Infrastructure

## Overview

Terraform IaC for TaskFlow Cloud on AWS.

## Modules

| Module    | Description                                    |
|-----------|------------------------------------------------|
| `vpc`     | VPC, public/private subnets, NAT gateway       |
| `eks`     | EKS cluster + managed node group               |
| `sqs`     | SQS queue with dead-letter queue               |
| `secrets` | AWS Secrets Manager secret placeholder         |

## Usage

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars as needed
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Remote State

Configure your S3 backend in `main.tf` before running `terraform init`:
- S3 bucket for state storage
- DynamoDB table for state locking
- KMS key for encryption (recommended)
