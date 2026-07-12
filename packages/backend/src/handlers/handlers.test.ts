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
        festival_day: "Friday"
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

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(JSON.stringify({ message: "Failed to create highscore" }));
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