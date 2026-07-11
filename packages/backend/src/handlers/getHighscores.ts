import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { FestivalDay, Category, HighscoreRecord } from "../../../shared/src/types.js";
import { dynamo, tableName } from "../lib/db.js";
import { jsonResponse } from "../lib/response.js";
import { sortHighscores } from "../lib/sort.js";

export async function handler(event: APIGatewayProxyEventV2) {
  const requestedCategory = event.queryStringParameters?.category as Category | undefined;
  const requestedFestivalDay = event.queryStringParameters?.festival_day as FestivalDay | "overall" | undefined;

  const command = new ScanCommand({
    TableName: tableName
  });

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

  return jsonResponse(200, {
    highscores: sorted
  });
}
