import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const logger = new Logger('SQLiteInitializer');

/**
 * Initialize SQLite database with schema and FTS5 support
 * @param dbPath Path to the SQLite database file
 */
export async function initializeSqliteDatabase(dbPath: string): Promise<void> {
  // Ensure directory exists
  const dbDir = path.dirname(dbPath);
  try {
    await fs.promises.access(dbDir);
  } catch {
    await fs.promises.mkdir(dbDir, { recursive: true });
    logger.log(`Created database directory: ${dbDir}`);
  }

  const isNewDatabase = !fs.existsSync(dbPath);

  if (isNewDatabase) {
    logger.log(`Creating new SQLite database at: ${dbPath}`);
  } else {
    logger.log(`Using existing SQLite database at: ${dbPath}`);
  }

  // Open database connection
  const db = new Database(dbPath);

  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Read and execute init script
    const initScriptPath = path.join(
      __dirname,
      '../../database/sqlite-init.sql',
    );

    if (fs.existsSync(initScriptPath)) {
      const initScript = await fs.promises.readFile(initScriptPath, 'utf-8');

      // Split by semicolons and execute each statement
      const statements = initScript
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          db.exec(statement);
        } catch (error) {
          const err = error as Error;
          // Ignore "already exists" errors for IF NOT EXISTS statements
          if (!err.message?.includes('already exists')) {
            logger.warn(`Statement warning: ${err.message}`);
          }
        }
      }

      logger.log('SQLite database schema initialized successfully');
    } else {
      logger.warn(`Init script not found at: ${initScriptPath}`);
    }
  } finally {
    db.close();
  }
}

/**
 * Check if SQLite database needs initialization
 * @param dbPath Path to the SQLite database file
 */
export function needsInitialization(dbPath: string): boolean {
  if (!fs.existsSync(dbPath)) {
    return true;
  }

  const db = new Database(dbPath, { readonly: true });
  try {
    // Check if users table exists
    const result = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      )
      .get();
    return !result;
  } finally {
    db.close();
  }
}
