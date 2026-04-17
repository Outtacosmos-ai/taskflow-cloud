provider "aws" {
  region = "us-east-1"
}

# 1. The S3 Bucket for the state file
resource "aws_s3_bucket" "terraform_state" {
  bucket = "taskflow-terraform-state-657577038059" # Must be globally unique
  
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "enabled" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 2. The DynamoDB Table for locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "taskflow-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}