terraform {
  required_version = ">= 1.0.0"

  backend "s3" {
    bucket  = "aws-devops-capstone-state-mohamed"
    key     = "dev/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- VPC Module ---
module "vpc" {
  source          = "../../modules/vpc"
  name            = "taskflow-dev-vpc"
  azs             = ["us-east-1a", "us-east-1b"]
  vpc_cidr        = "10.0.0.0/16" 
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
  tags            = var.tags
}

# --- EKS Module ---
module "eks" {
  source             = "../../modules/eks"
  cluster_name       = var.cluster_name
  kubernetes_version = "1.29"
  
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  
  node_instance_type = var.node_instance_type 
  node_desired_size  = var.node_desired_size
  node_min_size      = var.node_min_size
  node_max_size      = var.node_max_size
  tags               = var.tags
}

# --- SQS Module ---
module "sqs" {
  source     = "../../modules/sqs"
  queue_name = "taskflow-notifications-dev"
  tags       = var.tags
}

# --- Secrets ---
module "backend_secret" {
  source      = "../../modules/secretsmanager"
  secret_name = "taskflow/dev/backend"
  tags        = var.tags
}

module "worker_secret" {
  source      = "../../modules/secretsmanager"
  secret_name = "taskflow/dev/worker"
  tags        = var.tags
}
