terraform {
  required_version = ">= 1.0.0"

  backend "s3" {
    bucket         = "taskflow-terraform-state-657577038059"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "taskflow-terraform-locks"
    encrypt        = true
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
  vpc_cidr         = "10.0.0.0/16" 
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
  tags            = var.tags
}

# --- EKS Module ---
module "eks" {
  source             = "../../modules/eks"
  cluster_name       = var.cluster_name
  kubernetes_version = "1.30"
  
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

# --- IAM Role for Service Accounts (IRSA) ---
resource "aws_iam_role" "taskflow_pod_role" {
  name = "taskflow-pod-role-dev"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
        Condition = {
          StringEquals = {
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub" = "system:serviceaccount:taskflow:taskflow-sa"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "pod_access_policy" {
  name = "taskflow-pod-permissions"
  role = aws_iam_role.taskflow_pod_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = module.sqs.queue_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
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

# --- BUDGET MONGODB (EC2) ---
resource "aws_security_group" "mongodb_sg" {
  name         = "mongodb-sg-dev"
  description  = "Allow MongoDB traffic"
  vpc_id       = module.vpc.vpc_id 

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "mongodb_server" {
  ami                    = var.mongodb_ami
  instance_type          = var.mongodb_instance_type
  subnet_id              = module.vpc.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.mongodb_sg.id]

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker
              docker run -d -p 27017:27017 --name mongodb mongo:latest
              EOF

  tags = merge(var.tags, { Name = "TaskFlow-Dev-Budget-DB" })
}

output "pod_role_arn" {
  value = aws_iam_role.taskflow_pod_role.arn
}