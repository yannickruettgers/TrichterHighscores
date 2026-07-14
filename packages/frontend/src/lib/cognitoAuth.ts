export interface CognitoTokenConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
}

export interface CognitoCallback {
  code?: string;
  error?: string;
}

export function readCognitoCallback(url: string): CognitoCallback {
  const params = new URL(url).searchParams;
  return {
    code: params.get("code") ?? undefined,
    error: params.get("error") ?? undefined
  };
}

export async function exchangeCodeForToken(
  code: string,
  verifier: string,
  config: CognitoTokenConfig,
  fetcher: typeof fetch = fetch
): Promise<string> {
  if (!config.domain || !config.clientId) {
    throw new Error("Cognito-Umgebungsvariablen fehlen.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: verifier
  });
  const response = await fetcher(`${config.domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    throw new Error("Cognito-Anmeldung fehlgeschlagen. Bitte erneut anmelden.");
  }

  const payload = await response.json() as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || !payload.access_token) {
    throw new Error("Cognito hat kein Zugriffstoken zurückgegeben.");
  }
  return payload.access_token;
}
