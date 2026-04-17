output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_name" {
  value = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "mongodb_private_ip" {
  value = aws_instance.mongodb_server.private_ip
}

output "pod_role_arn" {
  value = aws_iam_role.taskflow_pod_role.arn
}

output "sqs_queue_url" {
  value = module.sqs.queue_url
}