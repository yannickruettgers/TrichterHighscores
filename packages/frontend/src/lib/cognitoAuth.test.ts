import { describe, expect, it, vi } from "vitest";
import { exchangeCodeForToken, readCognitoCallback } from "./cognitoAuth";

const config = {
  domain: "https://auth.example.com",
  clientId: "client-id",
  redirectUri: "https://example.com/admin"
};

describe("Cognito callback helpers", () => {
  it("reads successful and rejected callbacks", () => {
    expect(readCognitoCallback("https://example.com/admin?code=one-time-code")).toEqual({
      code: "one-time-code",
      error: undefined
    });
    expect(readCognitoCallback("https://example.com/admin?error=access_denied")).toEqual({
      code: undefined,
      error: "access_denied"
    });
  });

  it("exchanges a code with its PKCE verifier", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ access_token: "token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));

    await expect(exchangeCodeForToken("code", "verifier", config, fetcher)).resolves.toBe("token");
    expect(fetcher).toHaveBeenCalledOnce();
    const [, init] = fetcher.mock.calls[0];
    expect(String(init?.body)).toContain("code_verifier=verifier");
  });

  it("rejects failed and incomplete token responses", async () => {
    const failed = vi.fn(async () => new Response("{}", { status: 400 }));
    const incomplete = vi.fn(async () => new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }));

    await expect(exchangeCodeForToken("code", "verifier", config, failed)).rejects.toThrow("Cognito-Anmeldung fehlgeschlagen");
    await expect(exchangeCodeForToken("code", "verifier", config, incomplete)).rejects.toThrow("kein Zugriffstoken");
  });
});
