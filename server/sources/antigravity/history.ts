import { existsSync, statSync } from 'node:fs';
import type { RecentSession } from '../../../shared/types';
import type { AccountEntry } from '../../accounts/service';
import type { HistoryProvider, HistoryResolveResult, HistorySession } from '../source';
import { encodeCwd } from '../watcher';
import { AntigravityDb, decodeWorkspacePath, getTranscriptPath } from './files';
import { createAntigravityTerminalParser } from './terminal';
import { tr } from '../../../shared/i18n';

export interface AntigravityHistoryOptions {
  accounts: () => readonly AccountEntry[];
  openAgentOf?: (account: string, sessionId: string) => string | undefined;
}

export class AntigravityHistory implements HistoryProvider {
  readonly provider = 'antigravity' as const;

  constructor(private readonly opts: AntigravityHistoryOptions) {}

  hasAccount(account: string): boolean {
    return this.opts.accounts().some((a) => a.id === account);
  }

  async list(): Promise<RecentSession[]> {
    const out: RecentSession[] = [];
    const accounts = this.opts.accounts();

    for (const acc of accounts) {
      const db = new AntigravityDb(acc.dir);
      try {
        const rows = db.listRecent(50);
        for (const r of rows) {
          const at = Date.parse(r.last_modified_time) || Date.now();
          const project = decodeWorkspacePath(r.workspace_uris);
          const tPath = getTranscriptPath(acc.dir, r.conversation_id);
          let size = 0;
          try {
            if (existsSync(tPath)) size = statSync(tPath).size;
          } catch {
            // ignore
          }

          const agentId = this.opts.openAgentOf?.(acc.id, r.conversation_id);

          out.push({
            account: acc.id,
            provider: 'antigravity',
            sessionId: r.conversation_id,
            project,
            projectDir: project ? encodeCwd(project) : r.conversation_id,
            lastAt: at,
            title: r.title || undefined,
            size,
            open: !!agentId,
            agentId,
          });
        }
      } finally {
        db.close();
      }
    }

    return out.sort((a, b) => b.lastAt - a.lastAt);
  }

  resolve(account: string, sessionId: string): HistoryResolveResult {
    const acc = this.opts.accounts().find((a) => a.id === account);
    if (!acc) {
      return { status: 404, error: tr('conta desconhecida') };
    }

    const tPath = getTranscriptPath(acc.dir, sessionId);
    if (!existsSync(tPath)) {
      return { status: 404, error: tr('sessão não encontrada') };
    }

    const session: HistorySession = {
      path: tPath,
      createParser: () => createAntigravityTerminalParser(sessionId),
    };

    return session;
  }
}
