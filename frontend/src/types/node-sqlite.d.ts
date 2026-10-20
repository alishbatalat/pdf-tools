// @types/node (pinned to ^20 for the rest of this project) predates node:sqlite,
// which landed in Node 22.5+. Minimal shape for the subset this project uses,
// rather than bumping @types/node across major versions for one module.
declare module "node:sqlite" {
  export class StatementSync {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
