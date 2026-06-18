import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

async function main() {
  const client = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await client.end();
  console.log("Migrated.");
}
main().catch((e) => { console.error(e); process.exit(1); });
