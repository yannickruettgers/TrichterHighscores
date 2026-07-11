import { describe, expect, it } from "vitest";
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { isAdmin } from "./auth.js";

function buildEvent(groups: string | string[]): APIGatewayProxyEventV2WithJWTAuthorizer {
  return {
    version: "2.0",
    routeKey: "POST /api/highscores",
    rawPath: "/api/highscores",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "123456789012",
      apiId: "api-id",
      domainName: "example.com",
      domainPrefix: "example",
      http: {
        method: "POST",
        path: "/api/highscores",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "vitest"
      },
      requestId: "request-id",
      routeKey: "POST /api/highscores",
      stage: "$default",
      time: "09/Jul/2026:23:00:00 +0000",
      timeEpoch: 1783638000000,
      authorizer: {
        principalId: "admin-user",
        integrationLatency: 1,
        jwt: {
          claims: {
            "cognito:groups": groups
          },
          scopes: []
        }
      }
    },
    isBase64Encoded: false
  };
}

describe("isAdmin", () => {
  it("accepts an array claim containing admins", () => {
    expect(isAdmin(buildEvent(["admins", "staff"]))).toBe(true);
  });

  it("accepts a comma-separated string claim containing admins", () => {
    expect(isAdmin(buildEvent("admins,staff"))).toBe(true);
  });

  it("rejects users without the admins group", () => {
    expect(isAdmin(buildEvent("staff,volunteers"))).toBe(false);
  });
});
