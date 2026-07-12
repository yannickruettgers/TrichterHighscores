import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo, tableName } from "../lib/db.js";
import { emptyResponse, jsonResponse } from "../lib/response.js";
import { isAdmin } from "../lib/auth.js";

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  if (!isAdmin(event)) {
    return jsonResponse(403, { message: "Forbidden" });
  }

  const id = event.pathParameters?.id;

  if (!id) {
    return jsonResponse(400, { message: "Missing path parameter: id" });
  }

  try {
    await dynamo.send(new DeleteCommand({
      TableName: tableName,
      Key: { id }
    }));
  } catch {
    return jsonResponse(500, { message: "Failed to delete highscore" });
  }

  return emptyResponse(204);
}
