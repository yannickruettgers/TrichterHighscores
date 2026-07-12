########################################
# Packaging: bundle each Lambda handler
########################################

data "archive_file" "get_highscores" {
  type        = "zip"
  source_dir  = "${path.module}/../../packages/backend/dist/getHighscores"
  output_path = "${path.module}/.build/getHighscores.zip"
}

data "archive_file" "post_highscore" {
  type        = "zip"
  source_dir  = "${path.module}/../../packages/backend/dist/postHighscore"
  output_path = "${path.module}/.build/postHighscore.zip"
}

data "archive_file" "delete_highscore" {
  type        = "zip"
  source_dir  = "${path.module}/../../packages/backend/dist/deleteHighscore"
  output_path = "${path.module}/.build/deleteHighscore.zip"
}

########################################
# IAM: least-privilege execution roles
########################################

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# Read role: only allows reading from the highscores table.
resource "aws_iam_role" "lambda_read" {
  name               = "${local.prefix}-lambda-read"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "dynamo_read" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:GetItem"
    ]
    resources = [aws_dynamodb_table.highscores.arn]
  }
}

resource "aws_iam_role_policy" "lambda_read_dynamo" {
  name   = "${local.prefix}-read-dynamo"
  role   = aws_iam_role.lambda_read.id
  policy = data.aws_iam_policy_document.dynamo_read.json
}

resource "aws_iam_role_policy_attachment" "lambda_read_logs" {
  role       = aws_iam_role.lambda_read.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Write role: only allows put/delete on the highscores table.
resource "aws_iam_role" "lambda_write" {
  name               = "${local.prefix}-lambda-write"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "dynamo_write" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = [aws_dynamodb_table.highscores.arn]
  }
}

resource "aws_iam_role_policy" "lambda_write_dynamo" {
  name   = "${local.prefix}-write-dynamo"
  role   = aws_iam_role.lambda_write.id
  policy = data.aws_iam_policy_document.dynamo_write.json
}

resource "aws_iam_role_policy_attachment" "lambda_write_logs" {
  role       = aws_iam_role.lambda_write.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

########################################
# CloudWatch log groups (short retention = low cost)
########################################

resource "aws_cloudwatch_log_group" "get_highscores" {
  name              = "/aws/lambda/${local.prefix}-get-highscores"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "post_highscore" {
  name              = "/aws/lambda/${local.prefix}-post-highscore"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "delete_highscore" {
  name              = "/aws/lambda/${local.prefix}-delete-highscore"
  retention_in_days = 14
}

########################################
# Lambda functions (arm64 + small memory = low cost)
########################################

locals {
  lambda_runtime      = "nodejs22.x"
  lambda_architecture = "arm64"
  lambda_memory       = 256
  lambda_timeout      = 10
}

resource "aws_lambda_function" "get_highscores" {
  function_name    = "${local.prefix}-get-highscores"
  role             = aws_iam_role.lambda_read.arn
  handler          = "index.handler"
  runtime          = local.lambda_runtime
  architectures    = [local.lambda_architecture]
  memory_size      = local.lambda_memory
  timeout          = local.lambda_timeout
  filename         = data.archive_file.get_highscores.output_path
  source_code_hash = data.archive_file.get_highscores.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.highscores.name
      ALLOWED_ORIGIN      = "https://${var.domain_name}"
    }
  }

  depends_on = [aws_cloudwatch_log_group.get_highscores]
}

resource "aws_lambda_function" "post_highscore" {
  function_name    = "${local.prefix}-post-highscore"
  role             = aws_iam_role.lambda_write.arn
  handler          = "index.handler"
  runtime          = local.lambda_runtime
  architectures    = [local.lambda_architecture]
  memory_size      = local.lambda_memory
  timeout          = local.lambda_timeout
  filename         = data.archive_file.post_highscore.output_path
  source_code_hash = data.archive_file.post_highscore.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.highscores.name
      ALLOWED_ORIGIN      = "https://${var.domain_name}"
    }
  }

  depends_on = [aws_cloudwatch_log_group.post_highscore]
}

resource "aws_lambda_function" "delete_highscore" {
  function_name    = "${local.prefix}-delete-highscore"
  role             = aws_iam_role.lambda_write.arn
  handler          = "index.handler"
  runtime          = local.lambda_runtime
  architectures    = [local.lambda_architecture]
  memory_size      = local.lambda_memory
  timeout          = local.lambda_timeout
  filename         = data.archive_file.delete_highscore.output_path
  source_code_hash = data.archive_file.delete_highscore.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.highscores.name
      ALLOWED_ORIGIN      = "https://${var.domain_name}"
    }
  }

  depends_on = [aws_cloudwatch_log_group.delete_highscore]
}

########################################
# API Gateway HTTP API (cheaper than REST API)
########################################

resource "aws_apigatewayv2_api" "http" {
  name          = "${local.prefix}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://${var.domain_name}"]
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 3600
  }
}

resource "aws_acm_certificate" "api" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
}

resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = "api.${var.domain_name}"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.api.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

# JWT authorizer backed by the Cognito user pool.
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${local.prefix}-cognito-jwt"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.admin_client.id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.admin_pool.id}"
  }
}

# Integrations
resource "aws_apigatewayv2_integration" "get_highscores" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_highscores.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "post_highscore" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.post_highscore.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "delete_highscore" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_highscore.invoke_arn
  payload_format_version = "2.0"
}

# Routes: GET is public, POST/DELETE require a valid Cognito JWT.
resource "aws_apigatewayv2_route" "get_highscores" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /api/highscores"
  target    = "integrations/${aws_apigatewayv2_integration.get_highscores.id}"
}

resource "aws_apigatewayv2_route" "post_highscore" {
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "POST /api/highscores"
  target             = "integrations/${aws_apigatewayv2_integration.post_highscore.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "delete_highscore" {
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = "DELETE /api/highscores/{id}"
  target             = "integrations/${aws_apigatewayv2_integration.delete_highscore.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 20
    throttling_rate_limit  = 50
  }
}

resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = aws_apigatewayv2_api.http.id
  domain_name = aws_apigatewayv2_domain_name.api.id
  stage       = aws_apigatewayv2_stage.default.id
}

resource "aws_route53_record" "api_alias" {
  zone_id = var.hosted_zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Allow API Gateway to invoke each Lambda.
resource "aws_lambda_permission" "get_highscores" {
  statement_id  = "AllowInvokeGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_highscores.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "post_highscore" {
  statement_id  = "AllowInvokePost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_highscore.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete_highscore" {
  statement_id  = "AllowInvokeDelete"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_highscore.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
