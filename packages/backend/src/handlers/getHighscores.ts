import type { APIGatewayProxyEventV2, APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import {
  CATEGORIES,
  FESTIVAL_DAYS,
  type FestivalDay,
  type Category,
  type HighscoreRecord
} from "../../../shared/src/types.js";
import { dynamo, tableName } from "../lib/db.js";
import { jsonResponse } from "../lib/response.js";
import { sortHighscores } from "../lib/sort.js";
import { isAdmin } from "../lib/auth.js";

export async function handler(event: APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer) {
  const isAdminView = event.rawPath === "/api/admin/highscores";
  if (isAdminView && !isAdmin(event as APIGatewayProxyEventV2WithJWTAuthorizer)) {
    return jsonResponse(403, { message: "Forbidden" });
  }

  const requestedCategory = event.queryStringParameters?.category as Category | undefined;
  const requestedFestivalDay = event.queryStringParameters?.festival_day as FestivalDay | "overall" | undefined;

  if (requestedCategory && !CATEGORIES.includes(requestedCategory)) {
    return jsonResponse(400, { message: "Invalid category filter" });
  }

  if (requestedFestivalDay && requestedFestivalDay !== "overall" && !FESTIVAL_DAYS.includes(requestedFestivalDay)) {
    return jsonResponse(400, { message: "Invalid festival_day filter" });
  }

  const command = new ScanCommand({
    TableName: tableName
  });

  try {
    const data = await dynamo.send(command);
    const rawItems = (data.Items ?? []) as HighscoreRecord[];

    const filtered = rawItems.filter((record) => {
      const categoryMatch = requestedCategory ? record.category === requestedCategory : true;
      const dayMatch = requestedFestivalDay && requestedFestivalDay !== "overall"
        ? record.festival_day === requestedFestivalDay
        : true;

      return categoryMatch && dayMatch;
    });

    const sorted = sortHighscores(filtered);

    const highscores = isAdminView
      ? sorted
      : sorted.map((record) => ({
        id: record.id,
        pseudonym: record.pseudonym,
        time_seconds: record.time_seconds,
        category: record.category,
        festival_day: record.festival_day,
        achieved_at: record.achieved_at,
        created_at: record.created_at
      }));

    return jsonResponse(200, { highscores });
  } catch {
    return jsonResponse(500, { message: "Failed to load highscores" });
  }
}
