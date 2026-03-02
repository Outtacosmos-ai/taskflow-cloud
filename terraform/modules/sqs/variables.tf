variable "queue_name" {
  description = "SQS queue name"
  type        = string
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout (seconds)"
  type        = number
  default     = 30
}

variable "message_retention_seconds" {
  description = "Message retention period (seconds)"
  type        = number
  default     = 86400
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
