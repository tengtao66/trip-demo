import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "..", "terra.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run schema
const schema = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf-8");
db.exec(schema);

// Seed data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as {
  count: number;
};
if (userCount.count === 0) {
  const seed = readFileSync(join(__dirname, "..", "db", "seed.sql"), "utf-8");
  db.exec(seed);
  console.log("Database seeded with initial data");
}

export default db;
