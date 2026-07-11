# trichter.me - Trichter Highscores

Serverless festival highscore app for Parookaville.

## Current Status

- Monorepo base structure for frontend, backend, and Terraform has been created.
- Astro + Alpine frontend with main page and hidden admin route is scaffolded.
- Lambda handlers for `GET /api/highscores`, `POST /api/highscores`, `DELETE /api/highscores/{id}` are implemented in TypeScript and bundled with esbuild.
- Terraform provisions S3, CloudFront, Route53, ACM, DynamoDB, Cognito, GitHub OIDC, plus an HTTP API with Lambda integrations and a Cognito JWT authorizer.
- GitHub Actions deploy workflow validates backend types/tests, validates Terraform, and deploys the frontend to S3 + CloudFront invalidation.

## Security & Cost Notes

- HTTP API (API Gateway v2) is used instead of REST API for lower cost.
- Lambdas run on arm64 with 256 MB memory and a 10s timeout to keep cost low.
- Read and write Lambdas use separate least-privilege IAM roles (read-only vs. put/delete).
- Protected routes require a valid Cognito JWT; write/delete additionally enforce the `admins` group in code (defense-in-depth).
- CORS is restricted to the site origin both at the API and in Lambda responses.
- DynamoDB uses on-demand billing; CloudWatch log retention is capped at 14 days.
- The admin login uses OAuth2 authorization code flow with PKCE in the browser.

## Project Structure

```text
.
├── .github/workflows/deploy.yml
├── infra/terraform
├── packages
│   ├── backend
│   ├── frontend
│   └── shared
├── .env.example
└── package.json
```

## Prerequisites

- Node.js 24+
- npm 10+
- Terraform 1.15+
- AWS CLI v2

## Runtime Versions

- GitHub Actions build runtime: Node.js 24
- Local development baseline: Node.js 24+
- AWS Lambda runtime: Node.js 22.x (latest AWS-managed Node runtime currently available)

## Local Development

```bash
npm install
npm run dev:frontend
```

The frontend is then available locally through Astro.

## AWS Setup (Manual Steps)

1. Create a dedicated S3 bucket for Terraform state in `eu-central-1`.
1. Create a DynamoDB table for Terraform state locking.
1. Create a public Route53 hosted zone for `trichter.me` and copy the hosted zone ID.
1. At your external domain registrar, replace the domain nameservers with the four nameservers from the Route53 hosted zone.
1. Copy `infra/terraform/backend.hcl.example` to a local `backend.hcl` file and fill in your real bucket/table values.
1. Copy `infra/terraform/terraform.tfvars.example` to `infra/terraform/terraform.tfvars` and set at least:
	- `hosted_zone_id`
	- optionally customized `domain_name`
	- optionally customized `github_oidc_repo`
1. Build the backend Lambda bundles (Terraform packages these `dist/` folders):

```bash
npm install
npm run build:backend
```

1. Run Terraform:

```bash
cd infra/terraform
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

1. After a successful apply, note these outputs:
	- `frontend_bucket_name`
	- `cloudfront_distribution_id`
	- `github_actions_role_arn`
	- `cognito_client_id`
	- `cognito_domain`
	- `api_endpoint`

## AWS Bootstrap Details

### 1. Terraform state bucket

Create an S3 bucket for Terraform state, for example:

- `trichter-me-terraform-state-<aws-account-id>`

Recommended settings:

- Block all public access
- Enable bucket versioning
- Enable default encryption

### 2. Terraform lock table

Create a DynamoDB table for state locking:

- Table name: `trichter-me-terraform-locks`
- Partition key: `LockID` (String)
- Billing mode: On-demand

### 3. Route53 hosted zone

Create a public hosted zone for `trichter.me` in Route53. After creation, AWS will show four nameservers. These nameservers must be configured at your external registrar for the domain to resolve through Route53.

### 4. Cognito admin users

After the first `terraform apply`, go to Cognito:

1. Open the created user pool.
2. Create one or more admin users.
3. Add each admin user to the `admins` group.
4. Test the Hosted UI login once the frontend is reachable.

### 5. GitHub deployment access

After the first `terraform apply`, add these GitHub repository secrets:

- `AWS_DEPLOY_ROLE_ARN`
- `FRONTEND_BUCKET_NAME`
- `CLOUDFRONT_DISTRIBUTION_ID`

The IAM OIDC role itself is created by Terraform.

## GitHub Secrets for Deployment

Set the following repository secrets:

- `AWS_DEPLOY_ROLE_ARN` = Terraform Output `github_actions_role_arn`
- `FRONTEND_BUCKET_NAME` = Terraform Output `frontend_bucket_name`
- `CLOUDFRONT_DISTRIBUTION_ID` = Terraform Output `cloudfront_distribution_id`
- `PUBLIC_API_BASE_URL` = Terraform Output `api_endpoint`
- `PUBLIC_COGNITO_DOMAIN` = Terraform Output `cognito_domain`
- `PUBLIC_COGNITO_CLIENT_ID` = Terraform Output `cognito_client_id`
- `PUBLIC_COGNITO_REDIRECT_URI` = `https://trichter.me/admin`
- `TF_BACKEND_BUCKET` = `trichter-me-terraform-state-888577064621`
- `TF_BACKEND_KEY` = `prod/terraform.tfstate`
- `TF_BACKEND_DYNAMODB_TABLE` = `trichter-me-terraform-locks`
- `TF_VAR_HOSTED_ZONE_ID` = `Z04532382AA2IJOTWQEB4`

## Frontend Environment Variables

Copy `.env.example` to `.env` and set:

- `PUBLIC_API_BASE_URL`
- `PUBLIC_COGNITO_DOMAIN`
- `PUBLIC_COGNITO_CLIENT_ID`
- `PUBLIC_COGNITO_REDIRECT_URI`

## Next Technical Steps

- Add unit tests and API contract tests (validation, sorting/tie-breaker, admin enforcement).
- Optionally add a separate GitHub Actions workflow for `terraform plan`/`apply`.
- Add a custom domain (e.g. `api.trichter.me`) for the HTTP API.
- Add frontend integration coverage for the admin auth flow and 401/403 recovery.