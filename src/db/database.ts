import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface Session {
  id: string;
  created_at: number;
  updated_at: number;
  status: 'active' | 'completed' | 'error';
  query?: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ResearchArtifact {
  id: string;
  session_id: string;
  data_json: string;
  source: string;
  timestamp: number;
}

export class DatabaseService {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = '.dexter/dexter.db') {
    // Ensure the directory exists
    const dbDir = join(process.cwd(), '.dexter');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = join(process.cwd(), dbPath);
    this.db = new Database(this.dbPath);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');

    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active', 'completed', 'error')),
        query TEXT
      )
    `);

    // Create messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Create research_artifacts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS research_artifacts (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        data_json TEXT NOT NULL,
        source TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_research_artifacts_session_id ON research_artifacts(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
    `);
  }

  // Session methods
  createSession(id: string, query?: string): Session {
    const now = Date.now();
    const session: Session = {
      id,
      created_at: now,
      updated_at: now,
      status: 'active',
      query
    };

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, created_at, updated_at, status, query)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(session.id, session.created_at, session.updated_at, session.status, session.query);
    return session;
  }

  getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    return stmt.get(id) as Session | null;
  }

  getAllSessions(limit: number = 50): Session[] {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as Session[];
  }

  updateSessionStatus(id: string, status: 'active' | 'completed' | 'error'): void {
    const stmt = this.db.prepare(`
      UPDATE sessions
      SET status = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(status, Date.now(), id);
  }

  deleteSession(id: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }

  // Message methods
  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Message {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: sessionId,
      role,
      content,
      timestamp: Date.now()
    };

    const stmt = this.db.prepare(`
      INSERT INTO messages (id, session_id, role, content, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(message.id, message.session_id, message.role, message.content, message.timestamp);
    return message;
  }

  getSessionMessages(sessionId: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId) as Message[];
  }

  // Research artifact methods
  addResearchArtifact(sessionId: string, data: any, source: string): ResearchArtifact {
    const artifact: ResearchArtifact = {
      id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: sessionId,
      data_json: JSON.stringify(data),
      source,
      timestamp: Date.now()
    };

    const stmt = this.db.prepare(`
      INSERT INTO research_artifacts (id, session_id, data_json, source, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(artifact.id, artifact.session_id, artifact.data_json, artifact.source, artifact.timestamp);
    return artifact;
  }

  getSessionArtifacts(sessionId: string): ResearchArtifact[] {
    const stmt = this.db.prepare(`
      SELECT * FROM research_artifacts
      WHERE session_id = ?
      ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId) as ResearchArtifact[];
  }

  // Utility methods
  close(): void {
    this.db.close();
  }

  vacuum(): void {
    this.db.exec('VACUUM');
  }

  getStats(): { sessions: number; messages: number; artifacts: number } {
    const sessions = this.db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number };
    const messages = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
    const artifacts = this.db.prepare('SELECT COUNT(*) as count FROM research_artifacts').get() as { count: number };

    return {
      sessions: sessions.count,
      messages: messages.count,
      artifacts: artifacts.count
    };
  }
}

// Singleton instance
let dbInstance: DatabaseService | null = null;

export function getDatabase(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
