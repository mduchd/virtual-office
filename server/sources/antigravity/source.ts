import { existsSync } from 'node:fs';
import type { Provider, SourceInfo } from '../../../shared/types';
import type { AccountsService } from '../../accounts/service';
import { errMsg, log } from '../../log';
import type { Office } from '../../model/office';
import type { AgentSource } from '../source';
import { FileTail } from '../tail';
import type { TerminalParser } from '../terminal';
import { detectAntigravityAccounts } from './accounts';
import { AntigravityDb, decodeWorkspacePath, getTranscriptPath, readActivePresenceLocks } from './files';
import {
  createAntigravityTranscriptState,
  parseAntigravityLine,
  type AntigravityTranscriptState,
} from './transcript';
import { createAntigravityTerminalParser } from './terminal';
import { calculateAntigravityUsage } from './usage';
import { tr } from '../../../shared/i18n';

interface ConversationTracker {
  conversationId: string;
  accountId: string;
  accountDir: string;
  transcriptPath: string;
  tail?: FileTail;
  state: AntigravityTranscriptState;
  kind: 'main' | 'sub';
  parentId?: string;
  cwd: string;
  title?: string;
  startedAt: number;
  lastWriteAt: number;
  inOffice: boolean;
}

export interface AntigravitySourceOptions {
  accounts: AccountsService;
  office: Office;
  dirs: string[];
  env?: NodeJS.ProcessEnv;
  home?: string;
  now?: () => number;
  pollMs?: number;
}

export class AntigravitySource implements AgentSource {
  readonly provider: Provider = 'antigravity';
  private readonly trackers = new Map<string, ConversationTracker>();
  private readonly dbMap = new Map<string, AntigravityDb>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly now: () => number;
  private lastUsageCheck = 0;

  constructor(private readonly opts: AntigravitySourceOptions) {
    this.now = opts.now ?? Date.now;
  }

  start(): void {
    const detected = detectAntigravityAccounts(this.opts.dirs, this.opts.env);
    this.opts.accounts.setProviderAccounts(
      'antigravity',
      detected.map((d) => ({ dir: d.configDir, detected: d }))
    );

    for (const dir of this.opts.dirs) {
      this.dbMap.set(dir, new AntigravityDb(dir));
    }

    // Calcula e empurra o uso inicial das contas
    this.refreshUsage(detected);

    this.opts.office.beginBoot();
    try {
      this.poll(true);
    } catch (err) {
      log.error(`Antigravity: falha durante o boot inicial: ${errMsg(err)}`);
    } finally {
      this.opts.office.endBoot();
    }

    this.timer = setInterval(() => this.poll(false), this.opts.pollMs ?? 1_500);
    this.timer.unref?.();
  }

  private refreshUsage(accounts = detectAntigravityAccounts(this.opts.dirs, this.opts.env)): void {
    const now = this.now();
    this.lastUsageCheck = now;
    for (const acc of accounts) {
      try {
        const usage = calculateAntigravityUsage(acc.configDir, now);
        this.opts.accounts.setUsage(acc.id, usage);
      } catch (err) {
        log.warnOnce(`antigravity-usage:${acc.id}`, `Antigravity: falha ao calcular uso da conta ${acc.id}: ${errMsg(err)}`);
      }
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const db of this.dbMap.values()) {
      db.close();
    }
    this.dbMap.clear();
    this.trackers.clear();
  }

  sources(): SourceInfo[] {
    const accounts = this.opts.accounts.entriesOf('antigravity');
    return accounts.map((a) => ({
      provider: 'antigravity',
      label: a.id,
      path: a.dir,
      sessions: [...this.trackers.values()].filter((t) => t.accountId === a.id && t.inOffice).length,
      ok: true,
    }));
  }

  transcriptPathOf(agentId: string): string | undefined {
    return this.trackers.get(agentId)?.transcriptPath;
  }

  terminalParser(agentId: string): TerminalParser | undefined {
    return createAntigravityTerminalParser(agentId);
  }

  // ---------------------------------------------------------------- polling

  private poll(boot: boolean): void {
    const accounts = this.opts.accounts.entriesOf('antigravity');
    const activeLockIds = new Set<string>();

    const now = this.now();
    if (!boot && now - this.lastUsageCheck >= 30_000) {
      this.refreshUsage();
    }

    for (const acc of accounts) {
      const lockIds = readActivePresenceLocks(acc.dir);
      const db = this.dbMap.get(acc.dir);

      for (const id of lockIds) {
        activeLockIds.add(id);
        let t = this.trackers.get(id);
        if (!t) {
          t = this.createTracker(id, acc.id, acc.dir, db);
          if (t) this.trackers.set(id, t);
        }
        if (t) {
          this.syncTracker(t, db, boot);
        }
      }
    }

    // Marca como offline sessões cujos locks foram removidos
    for (const [id, t] of this.trackers) {
      if (!activeLockIds.has(id)) {
        if (t.inOffice) {
          if (t.kind === 'sub') {
            this.opts.office.completeSub(t.conversationId);
          } else {
            this.opts.office.closeMain(t.conversationId);
          }
          t.inOffice = false;
        }
        this.trackers.delete(id);
      }
    }
  }

  private createTracker(id: string, accountId: string, accountDir: string, db?: AntigravityDb): ConversationTracker | undefined {
    const tPath = getTranscriptPath(accountDir, id);
    const summary = db?.getSummary(id);
    const cwd = decodeWorkspacePath(summary?.workspace_uris) || process.cwd();
    const parentId = summary?.parent_conversation_id?.trim() || undefined;
    const startedAt = summary?.last_modified_time ? Date.parse(summary.last_modified_time) || this.now() : this.now();

    return {
      conversationId: id,
      accountId,
      accountDir,
      transcriptPath: tPath,
      state: createAntigravityTranscriptState(),
      kind: parentId ? 'sub' : 'main',
      parentId,
      cwd,
      title: summary?.title || undefined,
      startedAt,
      lastWriteAt: 0,
      inOffice: false,
    };
  }

  private syncTracker(t: ConversationTracker, db: AntigravityDb | undefined, boot: boolean): void {
    const { office } = this.opts;

    // 1. Inicia o tail do transcript se o arquivo existir
    if (!t.tail && existsSync(t.transcriptPath)) {
      t.tail = new FileTail(t.transcriptPath);
      if (!boot) {
        // Se entrou ao vivo, lê apenas o final recente
        t.tail.seekTail(128 * 1024);
      }
    }

    // 2. Garante que o agente está registrado no Office
    if (!t.inOffice) {
      if (t.kind === 'sub' && t.parentId) {
        const added = office.addSub({
          id: t.conversationId,
          parentId: t.parentId,
          sessionId: t.conversationId,
          role: tr('Subagente Antigravity'),
          title: t.title,
          background: false,
          startedAt: t.startedAt,
        });
        t.inOffice = added;
      } else {
        office.addMain({
          id: t.conversationId,
          provider: 'antigravity',
          account: t.accountId,
          sessionId: t.conversationId,
          cwd: t.cwd,
          role: tr('Agente Antigravity'),
          startedAt: t.startedAt,
          status: 'working',
        });
        t.inOffice = true;
      }
    }

    // 3. Lê linhas novas do transcript
    if (t.tail) {
      try {
        const r = t.tail.read();
        for (const line of r.lines) {
          const res = parseAntigravityLine(t.state, line, { idPrefix: t.conversationId, now: this.now() });
          for (const act of res.activities) {
            office.addActivity(t.conversationId, act, true);
          }
          if (res.status) {
            office.setStatus(t.conversationId, res.status, res.waitingFor);
          }
        }
      } catch (err) {
        log.warnOnce(`antigravity-tail:${t.conversationId}`, `Antigravity: erro lendo transcript de ${t.conversationId}: ${errMsg(err)}`);
      }
    }

    // 4. Consulta status no SQLite
    if (db) {
      const summary = db.getSummary(t.conversationId);
      if (summary) {
        if (summary.title && summary.title !== t.title) {
          t.title = summary.title;
        }

        const isRunning = summary.status === 'CASCADE_RUN_STATUS_RUNNING';
        const isIdle = summary.status === 'CASCADE_RUN_STATUS_IDLE';

        if (t.inOffice) {
          if (isRunning) {
            office.setStatus(t.conversationId, 'working');
          } else if (isIdle) {
            if (t.kind === 'sub') {
              office.completeSub(t.conversationId);
            } else {
              office.setStatus(t.conversationId, 'idle');
            }
          }

          office.applyTranscript(t.conversationId, {
            title: t.title,
            tasks: t.state.tasks,
            stats: t.state.stats,
            model: 'Gemini / Antigravity',
            firstAt: t.state.firstAt ?? t.startedAt,
            lastAt: t.state.lastAt ?? this.now(),
          });
        }
      }
    }
  }
}
