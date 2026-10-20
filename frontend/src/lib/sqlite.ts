import "server-only";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), ".data");
fs.mkdirSync(DATA_DIR, { recursive: true });

// One shared connection for the whole process — activity log and user
// accounts live in the same local SQLite file.
export const db = new DatabaseSync(path.join(DATA_DIR, "activity.db"));
