// Restrict CORS to the configured site origin for good security.
// Falls back to the production domain when the variable is not set.
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? "https://trichter.me";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    },
    body: JSON.stringify(body)
  };
}

export function emptyResponse(statusCode: number) {
  return {
    statusCode,
    headers: {
      ...corsHeaders()
    }
  };
}
