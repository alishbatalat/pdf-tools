import "server-only";
import { db } from "./sqlite";

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    target TEXT NOT NULL DEFAULT 'site',
    target_label TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_email, target)
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews (created_at DESC);
`);

export interface ReviewEntry {
  id: number;
  user_email: string;
  user_name: string;
  target: string;
  target_label: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const upsertStmt = db.prepare(`
  INSERT INTO reviews (user_email, user_name, target, target_label, rating, comment)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_email, target) DO UPDATE SET
    user_name = excluded.user_name,
    target_label = excluded.target_label,
    rating = excluded.rating,
    comment = excluded.comment,
    created_at = datetime('now')
`);

export function upsertReview(
  userEmail: string,
  userName: string,
  target: string,
  targetLabel: string,
  rating: number,
  comment: string | null,
) {
  upsertStmt.run(userEmail, userName, target, targetLabel, rating, comment);
}

const deleteStmt = db.prepare(`DELETE FROM reviews WHERE user_email = ? AND target = ?`);

export function deleteReview(userEmail: string, target: string) {
  deleteStmt.run(userEmail, target);
}

const selectAllStmt = db.prepare(`
  SELECT id, user_email, user_name, target, target_label, rating, comment, created_at
  FROM reviews ORDER BY created_at DESC LIMIT ?
`);

export function getAllReviews(limit = 300): ReviewEntry[] {
  const rows = selectAllStmt.all(limit) as unknown as ReviewEntry[];
  // node:sqlite rows aren't plain objects, which breaks passing them from a
  // server component straight into a client component's props.
  return rows.map((r) => ({ ...r }));
}

const statsStmt = db.prepare(`SELECT COUNT(*) as count, AVG(rating) as average FROM reviews`);

export function getReviewStats(): { count: number; average: number } {
  const row = statsStmt.get() as unknown as { count: number; average: number | null };
  return { count: row.count, average: row.average ?? 0 }; // already a plain literal
}

const statsForTargetStmt = db.prepare(
  `SELECT COUNT(*) as count, AVG(rating) as average FROM reviews WHERE target = ?`,
);

export function getStatsForTarget(target: string): { count: number; average: number } {
  const row = statsForTargetStmt.get(target) as unknown as { count: number; average: number | null };
  return { count: row.count, average: row.average ?? 0 };
}
