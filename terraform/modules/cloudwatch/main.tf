# NOTE: We no longer create a manual log group here because the 
# EKS CloudWatch Observability add-on creates and manages the 
# /aws/containerinsights/taskflow-dev/application group automatically.

# Creates a metric filter to scan the ACTIVE EKS application logs for errors
resource "aws_cloudwatch_log_metric_filter" "backend_errors" {
  name           = "TaskFlow-Backend-Errors"
  pattern        = "ERROR"
  
  # Pointing to the group created by the EKS Add-on
  log_group_name = "/aws/containerinsights/taskflow-dev/application"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "TaskFlowMetrics"
    value         = "1"
    # default_value = 0 ensures the metric exists even when there are no errors
    default_value = 0
  }
}

# Creates an Alarm that triggers if 10+ errors occur within 10 minutes (2 periods of 5m)
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "taskflow-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "TaskFlowMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors backend errors in the EKS application logs"
  
  # Optional: treat_missing_data as "notBreaching" prevents false alarms if logs are quiet
  treat_missing_data  = "notBreaching"
}