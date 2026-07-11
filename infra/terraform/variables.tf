variable "project_name" {
  description = "Project short name"
  type        = string
  default     = "trichter-me"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "domain_name" {
  description = "Main domain for CloudFront"
  type        = string
  default     = "trichter.me"
}

variable "hosted_zone_id" {
  description = "Route53 Hosted Zone ID"
  type        = string
}

variable "github_oidc_repo" {
  description = "GitHub owner/repo for OIDC trust"
  type        = string
  default     = "yannickruettgers/TrichterHighscores"
}
