import { existsSync, readdirSync, statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../../log';

export interface AntigravitySummaryRow {
  conversation_id: string;
  title: string;
  workspace_uris: string;
  status: string;
  last_modified_time: string;
  step_count: number;
  parent_conversation_id?: string;
  agent_name?: string;
  not_fully_idle?: number;
  killed?: number;
}

/** Lê os locks presentes em <dir>/presence/ (*.lock). Cada um é um id de conversa ativa. */
export function readActivePresenceLocks(dir: string): string[] {
  const presenceDir = join(dir, 'presence');
  try {
    const files = readdirSync(presenceDir);
    return files
      .filter((f) => f.endsWith('.lock'))
      .map((f) => f.slice(0, -5));
  } catch {
    return [];
  }
}

/** Decodifica o workspace_uris salvo no banco (JSON string array) para um caminho de diretório local. */
export function decodeWorkspacePath(rawUris: string | undefined): string | undefined {
  if (!rawUris || typeof rawUris !== 'string' || !rawUris.trim()) return undefined;
  let uri = rawUris.trim();
  if (uri.startsWith('[')) {
    try {
      const arr = JSON.parse(uri) as unknown;
      if (Array.isArray(arr) && typeof arr[0] === 'string') {
        uri = arr[0];
      }
    } catch {
      // continua com uri bruto
    }
  }

  try {
    const decoded = decodeURIComponent(uri).replace(/\\/g, '/');
    if (decoded.startsWith('file://')) {
      return fileURLToPath(decoded);
    }
    return decoded;
  } catch {
    return undefined;
  }
}

/** Caminho do transcript JSONL de uma conversa. */
export function getTranscriptPath(dir: string, conversationId: string): string {
  return join(dir, 'brain', conversationId, '.system_generated', 'logs', 'transcript.jsonl');
}

/** Gerenciador de conexão com conversation_summaries.db (SQLite em modo somente-leitura). */
export class AntigravityDb {
  private db: DatabaseSync | null = null;
  readonly path: string;

  constructor(dir: string) {
    this.path = join(dir, 'conversation_summaries.db');
  }

  private ensureOpen(): DatabaseSync | null {
    if (this.db) return this.db;
    if (!existsSync(this.path)) return null;
    try {
      this.db = new DatabaseSync(this.path, { readOnly: true });
      return this.db;
    } catch (err) {
      log.warnOnce(`antigravity-db-open:${this.path}`, `Antigravity: falha ao abrir ${this.path}: ${String(err)}`);
      return null;
    }
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // ignore
      }
      this.db = null;
    }
  }

  getSummary(conversationId: string): AntigravitySummaryRow | undefined {
    const db = this.ensureOpen();
    if (!db) return undefined;
    try {
      const stmt = db.prepare(
        'SELECT conversation_id, title, workspace_uris, status, last_modified_time, step_count, parent_conversation_id, agent_name, not_fully_idle, killed ' +
        'FROM conversation_summaries WHERE conversation_id = ?'
      );
      const row = stmt.get(conversationId) as unknown;
      return (row && typeof row === 'object' ? (row as AntigravitySummaryRow) : undefined);
    } catch (err) {
      log.warnOnce(`antigravity-db-query:${conversationId}`, `Antigravity: erro ao consultar conversa ${conversationId}: ${String(err)}`);
      return undefined;
    }
  }

  listRecent(limit = 50): AntigravitySummaryRow[] {
    const db = this.ensureOpen();
    if (!db) return [];
    try {
      const stmt = db.prepare(
        'SELECT conversation_id, title, workspace_uris, status, last_modified_time, step_count, parent_conversation_id, agent_name, not_fully_idle, killed ' +
        'FROM conversation_summaries ORDER BY last_modified_time DESC LIMIT ?'
      );
      return stmt.all(limit) as unknown as AntigravitySummaryRow[];
    } catch (err) {
      log.warnOnce('antigravity-db-list', `Antigravity: erro ao listar conversas recentes: ${String(err)}`);
      return [];
    }
  }
}
