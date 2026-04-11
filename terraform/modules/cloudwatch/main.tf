# Creates a centralized log group for the EKS cluster application logs
resource "aws_cloudwatch_log_group" "taskflow_logs" {
  name              = "/ecs/taskflow-cluster"
  retention_in_days = 14

  tags = {
    Environment = var.environment
    Project     = "TaskFlow"
  }
}

# Creates a metric filter to count Errors in the backend logs
resource "aws_cloudwatch_log_metric_filter" "backend_errors" {
  name           = "TaskFlow-Backend-Errors"
  pattern        = "ERROR"
  log_group_name = aws_cloudwatch_log_group.taskflow_logs.name

  metric_transformation {
    name      = "ErrorCount"
    namespace = "TaskFlowMetrics"
    value     = "1"
  }
}

# Creates an Alarm if there are too many errors
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "taskflow-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "TaskFlowMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors backend errors"
}