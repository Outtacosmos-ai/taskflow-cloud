terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Fill in your S3 backend details or use terraform init -backend-config
    # bucket         = "taskflow-terraform-state"
    # key            = "dev/terraform.tfstate"
    # region         = "us-east-1"
    # dynamodb_table = "taskflow-terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    Project     = "taskflow-cloud"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

module "vpc" {
  source = "../../modules/vpc"

  name            = "taskflow-dev"
  vpc_cidr        = "10.0.0.0/16"
  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
  tags            = local.tags
}

module "eks" {
  source = "../../modules/eks"

  cluster_name      = "taskflow-dev"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  node_desired_size = 2
  node_min_size     = 1
  node_max_size     = 3
  tags              = local.tags
}

module "sqs" {
  source = "../../modules/sqs"

  queue_name = "taskflow-notifications-dev"
  tags       = local.tags
}

module "backend_secret" {
  source = "../../modules/secrets"

  secret_name        = "taskflow/dev/backend"
  secret_description = "TaskFlow backend secrets (dev)"
  tags               = local.tags
}

module "worker_secret" {
  source = "../../modules/secrets"

  secret_name        = "taskflow/dev/worker"
  secret_description = "TaskFlow worker secrets (dev)"
  tags               = local.tags
}
