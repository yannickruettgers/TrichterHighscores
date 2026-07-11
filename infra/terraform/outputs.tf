output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "api_endpoint" {
  value       = aws_apigatewayv2_api.http.api_endpoint
  description = "Base URL of the HTTP API (use as PUBLIC_API_BASE_URL)."
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.admin_pool.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.admin_client.id
}

output "cognito_domain" {
  value = "https://${aws_cognito_user_pool_domain.admin_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_deploy.arn
}
