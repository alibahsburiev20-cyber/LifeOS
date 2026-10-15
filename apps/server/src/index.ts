// SPDX-License-Identifier: Apache-2.0
import { openDatabase } from "./db.js";
import { buildServer } from "./server.js";
import { loadSecretKey } from "./secrets.js";

// Safe default: listen on the local machine only.
const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DATABASE_PATH ?? "./data/lifeos.db";
const secureCookies = process.env.COOKIE_SECURE === "true";

if (!["127.0.0.1", "localhost", "::1"].includes(host) && !secureCookies) {
  console.warn(
    `WARNING: listening on ${host} without COOKIE_SECURE=true. Serve LifeOS over HTTPS only (for example behind a reverse proxy) and set COOKIE_SECURE=true.`,
  );
}

const db = openDatabase(dbPath);
const app = buildServer(db, { auth: { secureCookies }, secretKey: loadSecretKey(dbPath) });

const shutdown = async () => {
  await app.close();
  db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ host, port });
console.log(`LifeOS is running. Open http://${host}:${port} in your browser (database: ${dbPath}).`);
console.log("First run: the page asks you to choose a passphrase. Do this yourself before exposing the server to anyone else.");
