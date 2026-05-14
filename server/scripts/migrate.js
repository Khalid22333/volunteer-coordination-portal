// scripts/migrate.js
//
// Runs a single SQL migration file through the same MySQL connection the
// server uses. Lets us apply migrations without depending on the `mysql`
// CLI being on PATH (which it often isn't on Windows).
//
// Run from the `server/` directory:
//   npm run migrate -- migrations/003_add_profile_fields.sql
//   npm run migrate -- 003_add_profile_fields.sql            (also works)
//
// What it does:
//   1. Reads the .sql file.
//   2. Strips comments and `USE <db>;` statements (the connection is
//      already pointed at the right database via DB_NAME in .env).
//   3. Splits on `;` and runs each remaining statement in order.
//
// Re-running an already-applied migration will error with "Duplicate
// column name" or similar — that's expected, since the existing
// migration files are explicitly NOT idempotent. The script reports
// the error and exits non-zero so you notice.

const fs = require('fs');
const path = require('path');
const db = require('../src/db');

async function migrate() {
  // Accept either a full relative path ("migrations/003_…") or a bare
  // filename ("003_…"). Bare names resolve under server/migrations/.
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: npm run migrate -- <migration-file>');
    console.error('  e.g. npm run migrate -- 003_add_profile_fields.sql');
    process.exitCode = 1;
    return;
  }

  const candidates = [
    path.resolve(__dirname, '..', arg),
    path.resolve(__dirname, '..', 'migrations', arg),
  ];
  const filePath = candidates.find(p => fs.existsSync(p));
  if (!filePath) {
    console.error(`Migration file not found. Tried:\n  - ${candidates.join('\n  - ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Running migration: ${path.relative(process.cwd(), filePath)}`);

  // Read the file and strip out:
  //   * line comments starting with --
  //   * USE <db>; statements (our pool already targets the right DB)
  const raw = fs.readFileSync(filePath, 'utf8');
  const cleaned = raw
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split on `;` to get individual statements. This is a simple splitter —
  // it would break on a `;` inside a string literal, but our migrations
  // are pure DDL with no string literals, so we're fine.
  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !/^use\s+\w+$/i.test(s));

  if (statements.length === 0) {
    console.error('No executable SQL statements found in file.');
    process.exitCode = 1;
    return;
  }

  try {
    for (const stmt of statements) {
      const preview = stmt.replace(/\s+/g, ' ').slice(0, 80);
      console.log(`  > ${preview}${stmt.length > 80 ? '…' : ''}`);
      await db.query(stmt);
    }
    console.log(`Migration applied: ${statements.length} statement(s).`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    // Pool keeps the process alive otherwise.
    await db.end();
  }
}

migrate();
