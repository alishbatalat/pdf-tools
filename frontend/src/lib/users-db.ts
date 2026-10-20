import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db } from "./sqlite";

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export interface StoredUser {
  id: number;
  email: string;
  name: string;
  password_hash: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

const insertUserStmt = db.prepare(
  `INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)`,
);
const getUserByEmailStmt = db.prepare(`SELECT * FROM users WHERE email = ?`);

export function createUser(email: string, name: string, password: string): StoredUser {
  const normalizedEmail = email.trim().toLowerCase();
  insertUserStmt.run(normalizedEmail, name.trim(), hashPassword(password));
  return getUserByEmailStmt.get(normalizedEmail) as unknown as StoredUser;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return getUserByEmailStmt.get(email.trim().toLowerCase()) as unknown as StoredUser | undefined;
}

export function authenticateUser(email: string, password: string): StoredUser | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  return verifyPassword(password, user.password_hash) ? user : null;
}
