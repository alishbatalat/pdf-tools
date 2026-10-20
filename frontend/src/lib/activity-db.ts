import "server-only";
import { db } from "./sqlite";

db.exec(`
  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    tool_slug TEXT NOT NULL,
    tool_title TEXT NOT NULL,
    file_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_activity_user ON activity (user_email, created_at DESC);
`);

export interface ActivityEntry {
  id: number;
  tool_slug: string;
  tool_title: string;
  file_name: string | null;
  created_at: string;
}

const insertStmt = db.prepare(
  `INSERT INTO activity (user_email, tool_slug, tool_title, file_name) VALUES (?, ?, ?, ?)`,
);

export function recordActivity(
  userEmail: string,
  toolSlug: string,
  toolTitle: string,
  fileName: string | null,
) {
  insertStmt.run(userEmail, toolSlug, toolTitle, fileName);
}

const selectStmt = db.prepare(
  `SELECT id, tool_slug, tool_title, file_name, created_at
   FROM activity WHERE user_email = ? ORDER BY created_at DESC LIMIT ?`,
);

export function getActivity(userEmail: string, limit = 100): ActivityEntry[] {
  return selectStmt.all(userEmail, limit) as unknown as ActivityEntry[];
}
