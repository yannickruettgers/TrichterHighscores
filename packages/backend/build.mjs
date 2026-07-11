import { build } from "esbuild";
import { mkdirSync } from "node:fs";

const handlers = [
  { name: "getHighscores", entry: "src/handlers/getHighscores.ts" },
  { name: "postHighscore", entry: "src/handlers/postHighscore.ts" },
  { name: "deleteHighscore", entry: "src/handlers/deleteHighscore.ts" }
];

mkdirSync("dist", { recursive: true });

await Promise.all(
  handlers.map((handler) =>
    build({
      entryPoints: [handler.entry],
      outfile: `dist/${handler.name}/index.mjs`,
      bundle: true,
      platform: "node",
      target: "node20",
      format: "esm",
      minify: true,
      sourcemap: false,
      // AWS SDK v3 is provided by the Lambda Node.js 20 runtime.
      // Keeping it external reduces bundle size, cost, and cold-start time.
      external: ["@aws-sdk/*"]
    })
  )
);

console.log("Backend handlers bundled to dist/");
