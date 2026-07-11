import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";

const ADMIN_GROUP = "admins";

/**
 * Verifies that the authenticated caller belongs to the Cognito "admins" group.
 * This is defense-in-depth on top of the API Gateway JWT authorizer.
 */
export function isAdmin(event: APIGatewayProxyEventV2WithJWTAuthorizer): boolean {
  const claims = event.requestContext.authorizer?.jwt?.claims ?? {};
  const groups = claims["cognito:groups"];

  if (Array.isArray(groups)) {
    return groups.includes(ADMIN_GROUP);
  }

  if (typeof groups === "string") {
    // Cognito may serialize groups as a bracketed or comma-separated string.
    return groups
      .replace(/[[\]]/g, "")
      .split(/[\s,]+/)
      .filter(Boolean)
      .includes(ADMIN_GROUP);
  }

  return false;
}
