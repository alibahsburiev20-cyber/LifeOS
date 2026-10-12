// SPDX-License-Identifier: Apache-2.0
import { buildApp } from "./app.js";
import { openDatabase } from "./db.js";

// Safe default: listen on the local machine only. There is no authentication yet.
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DATABASE_PATH ?? "./data/lifeos.db";

if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  console.warn(
    `WARNING: listening on ${host}. The server has NO authentication yet; do not expose it to a network.`,
  );
}

const db = openDatabase(dbPath);
const app = buildApp(db);

const shutdown = async () => {
  await app.close();
  db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ host, port });
console.log(`LifeOS server listening on http://${host}:${port} (database: ${dbPath})`);
