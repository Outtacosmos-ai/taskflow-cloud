# Metric Filter (Identifies the errors in logs)
resource "aws_cloudwatch_log_metric_filter" "backend_errors" {
  name           = "TaskFlow-Backend-Errors"
  pattern        = "ERROR"
  log_group_name = "/aws/containerinsights/taskflow-dev/application"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "TaskFlowMetrics"
    value         = "1"
    default_value = 0
  }
}

# The "Audit-Proof" Alarm
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "taskflow-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  
  # Sharp response: 1 period of 1 minute
  evaluation_periods  = "1"
  metric_name         = "ErrorCount"
  namespace           = "TaskFlowMetrics"
  period              = "60" 
  statistic           = "Sum"
  
  # Threshold at 1: Any error triggers the alarm
  threshold           = "1" 

  # Treat missing data as a breach to detect service silence
  treat_missing_data  = "breaching" 

  # Link to the SNS topic passed via variable
  alarm_actions       = [var.sns_topic_arn]
  ok_actions          = [var.sns_topic_arn]

  alarm_description   = "Immediate alert for backend errors or DB connection loss. Audit threshold set to 1 error/min."
}