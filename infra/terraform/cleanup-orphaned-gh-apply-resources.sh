#!/usr/bin/env bash

set -euo pipefail

PROFILE="${AWS_PROFILE:-${1:-trichter-me-bootstrap}}"
AWS_PAGER=""
export AWS_PAGER

API_ID="j6dlf0ko6c"
USER_POOL_ID="eu-central-1_U7nqYuVzi"
CERT_ARN="arn:aws:acm:us-east-1:888577064621:certificate/6d0ae5e2-de08-4506-bf1c-db08ac402e3f"

log() {
  printf '%s\n' "$*"
}

exists_api() {
  aws apigatewayv2 get-api \
    --api-id "$API_ID" \
    --profile "$PROFILE" \
    --region eu-central-1 \
    >/dev/null 2>&1
}

exists_user_pool() {
  aws cognito-idp describe-user-pool \
    --user-pool-id "$USER_POOL_ID" \
    --profile "$PROFILE" \
    --region eu-central-1 \
    >/dev/null 2>&1
}

exists_certificate() {
  aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --profile "$PROFILE" \
    --region us-east-1 \
    >/dev/null 2>&1
}

wait_until_gone() {
  local name="$1"
  local probe="$2"

  for _ in $(seq 1 30); do
    if ! eval "$probe"; then
      log "$name entfernt"
      return 0
    fi

    sleep 2
  done

  log "$name existiert noch; bitte manuell nachpruefen"
  return 1
}

log "Verwende AWS-Profil: $PROFILE"

if exists_api; then
  log "Loesche verwaiste HTTP API $API_ID"
  aws apigatewayv2 delete-api \
    --api-id "$API_ID" \
    --profile "$PROFILE" \
    --region eu-central-1
  wait_until_gone "HTTP API $API_ID" "exists_api"
else
  log "HTTP API $API_ID nicht gefunden"
fi

if exists_user_pool; then
  log "Loesche verwaisten Cognito User Pool $USER_POOL_ID"
  aws cognito-idp delete-user-pool \
    --user-pool-id "$USER_POOL_ID" \
    --profile "$PROFILE" \
    --region eu-central-1
  wait_until_gone "Cognito User Pool $USER_POOL_ID" "exists_user_pool"
else
  log "Cognito User Pool $USER_POOL_ID nicht gefunden"
fi

if exists_certificate; then
  log "Loesche verwaistes ACM-Zertifikat $CERT_ARN"
  aws acm delete-certificate \
    --certificate-arn "$CERT_ARN" \
    --profile "$PROFILE" \
    --region us-east-1
  wait_until_gone "ACM-Zertifikat $CERT_ARN" "exists_certificate"
else
  log "ACM-Zertifikat $CERT_ARN nicht gefunden"
fi

log "Cleanup abgeschlossen"