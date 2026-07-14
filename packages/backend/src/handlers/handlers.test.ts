import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn()
}));

vi.mock("../lib/db.js", () => ({
  dynamo: {
    send: sendMock
  },
  tableName: "parookaville-highscores"
}));

import { handler as getHighscores } from "./getHighscores.js";
import { handler as postHighscore } from "./postHighscore.js";
import { handler as deleteHighscore } from "./deleteHighscore.js";

describe("handler error paths", () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it("rejects an invalid GET category filter", async () => {
    const response = await getHighscores({
      queryStringParameters: {
        category: "2.0l"
      }
    } as never);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: "Invalid category filter" }));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 500 when GET cannot read from DynamoDB", async () => {
    sendMock.mockRejectedValueOnce(new Error("boom"));

    const response = await getHighscores({} as never);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(JSON.stringify({ message: "Failed to load highscores" }));
  });

  it("does not expose admin attribution in the public GET response", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [{
        id: "score-1",
        pseudonym: "FunnelFox",
        time_seconds: 1.234,
        category: "0.5l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T18:30:00.000Z",
        created_at: "2026-07-24T18:31:00.000Z",
        created_by: "admin-user"
      }]
    });

    const response = await getHighscores({ rawPath: "/api/highscores" } as never);
    expect(JSON.parse(response.body ?? "{}").highscores[0]).not.toHaveProperty("created_by");
  });

  it("returns attribution only from the protected admin GET response", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [{
        id: "score-1",
        pseudonym: "FunnelFox",
        time_seconds: 1.234,
        category: "0.5l",
        festival_day: "Friday",
        created_at: "2026-07-24T18:31:00.000Z",
        created_by: "admin-user"
      }]
    });

    const response = await getHighscores({
      rawPath: "/api/admin/highscores",
      requestContext: { authorizer: { jwt: { claims: { "cognito:groups": ["admins"] } } } }
    } as never);

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? "{}").highscores[0].created_by).toBe("admin-user");
  });

  it("forbids the admin GET response without the admins group", async () => {
    const response = await getHighscores({
      rawPath: "/api/admin/highscores",
      requestContext: { authorizer: { jwt: { claims: {} } } }
    } as never);

    expect(response.statusCode).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON in POST", async () => {
    const response = await postHighscore({
      body: "{",
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              "cognito:groups": ["admins"]
            }
          }
        }
      }
    } as never);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: "Invalid JSON body" }));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 500 when POST cannot write to DynamoDB", async () => {
    sendMock.mockRejectedValueOnce(new Error("boom"));

    const response = await postHighscore({
      body: JSON.stringify({
        pseudonym: "FunnelFox",
        time_seconds: 1.234,
        category: "0.5l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T18:30:00.000Z"
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              "cognito:groups": ["admins"],
              username: "admin-user"
            }
          }
        }
      }
    } as never);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(JSON.stringify({ message: "Failed to create highscore" }));
  });

  it("stores trusted audit fields for a successful POST", async () => {
    sendMock.mockResolvedValueOnce({});

    const response = await postHighscore({
      body: JSON.stringify({
        pseudonym: " FunnelFox ",
        time_seconds: 1.234,
        category: "0.5l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T20:30:00+02:00",
        created_by: "spoofed-user"
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              "cognito:groups": ["admins"],
              username: "real-admin"
            }
          }
        }
      }
    } as never);

    expect(response.statusCode).toBe(201);
    const item = JSON.parse(response.body ?? "{}") as Record<string, unknown>;
    expect(item).toMatchObject({
      pseudonym: "FunnelFox",
      achieved_at: "2026-07-24T18:30:00.000Z",
      created_by: "real-admin"
    });
    expect(typeof item.created_at).toBe("string");
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock.mock.calls[0]?.[0].input.Item).toEqual(item);
  });

  it("rejects an admin without an attributable username", async () => {
    const response = await postHighscore({
      body: JSON.stringify({
        pseudonym: "FunnelFox",
        time_seconds: 1.234,
        category: "0.5l",
        festival_day: "Friday",
        achieved_at: "2026-07-24T18:30:00.000Z"
      }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              "cognito:groups": ["admins"]
            }
          }
        }
      }
    } as never);

    expect(response.statusCode).toBe(403);
    expect(response.body).toBe(JSON.stringify({ message: "Missing admin identity" }));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("returns 500 when DELETE cannot remove from DynamoDB", async () => {
    sendMock.mockRejectedValueOnce(new Error("boom"));

    const response = await deleteHighscore({
      pathParameters: {
        id: "123"
      },
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              "cognito:groups": ["admins"]
            }
          }
        }
      }
    } as never);

    expect(response.statusCode).toBe(500);
    expect("body" in response ? response.body : undefined).toBe(JSON.stringify({ message: "Failed to delete highscore" }));
  });
});