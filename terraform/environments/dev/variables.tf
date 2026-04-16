variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "taskflow-dev"
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS nodes"
  type        = string
}

variable "node_desired_size" {
  description = "Desired number of worker nodes"
  type        = number
}

variable "node_min_size" {
  description = "Minimum number of worker nodes"
  type        = number
}

variable "node_max_size" {
  description = "Maximum number of worker nodes"
  type        = number
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "taskflow"
  }
}

# --- MongoDB Variables ---
variable "mongodb_instance_type" {
  description = "Instance type for the MongoDB EC2"
  type        = string
  default     = "t3.micro"
}

variable "mongodb_ami" {
  description = "AMI ID for Amazon Linux 2023 in us-east-1"
  type        = string
  default     = "ami-0c7217cdde317cfec"
}