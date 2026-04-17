variable "environment" {
  description = "The environment name (e.g. dev, prod)"
  type        = string
}

variable "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts"
  type        = string
}