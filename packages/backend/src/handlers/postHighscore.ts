import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { randomUUID } from "node:crypto";
import type { HighscoreRecord } from "../../../shared/src/types.js";
import { dynamo, tableName } from "../lib/db.js";
import { jsonResponse } from "../lib/response.js";
import { isCreateHighscoreInput } from "../lib/validation.js";
import { isAdmin } from "../lib/auth.js";

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  if (!isAdmin(event)) {
    return jsonResponse(403, { message: "Forbidden" });
  }

  if (!event.body) {
    return jsonResponse(400, { message: "Missing body" });
  }

  const parsed = JSON.parse(event.body) as unknown;

  if (!isCreateHighscoreInput(parsed)) {
    return jsonResponse(422, { message: "Invalid payload" });
  }

  const item: HighscoreRecord = {
    id: randomUUID(),
    pseudonym: parsed.pseudonym.trim(),
    time_seconds: Number(parsed.time_seconds.toFixed(3)),
    category: parsed.category,
    festival_day: parsed.festival_day,
    created_at: new Date().toISOString()
  };

  await dynamo.send(new PutCommand({
    TableName: tableName,
    Item: item
  }));

  return jsonResponse(201, item);
}
