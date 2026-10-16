// Mensagens pelo escritório para as sessões do Google Antigravity:
// `agentapi send-message <conversationId> <content>` envia a mensagem diretamente para o agente.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, isAbsolute, join } from 'node:path';
import { tr } from '../../shared/i18n';

export const ANTIGRAVITY_TIMEOUT_MS = 20_000;

export interface AntigravityMessageJob {
  conversationId: string;
  text: string;
}

export type AntigravityMessageResult = { ok: true } | { ok: false; error: string };
export type AntigravityMessageRunner = (job: AntigravityMessageJob) => Promise<AntigravityMessageResult>;

export const AGENTAPI_BIN_NAME = process.platform === 'win32' ? 'agentapi.bat' : 'agentapi';

export function findAntigravityBin(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const explicit = env.HABBLAUD_ANTIGRAVITY_BIN?.trim();
  if (explicit && existsSync(explicit)) return explicit;

  // Verifica ~/.gemini/antigravity/bin/agentapi(.bat)
  const home = env.HOME || env.USERPROFILE || homedir();
  const defaultPath = join(home, '.gemini', 'antigravity', 'bin', AGENTAPI_BIN_NAME);
  if (existsSync(defaultPath)) return defaultPath;

  for (const dir of (env.PATH ?? '').split(delimiter)) {
    if (!dir || !isAbsolute(dir)) continue;
    const p = join(dir, AGENTAPI_BIN_NAME);
    if (existsSync(p)) return p;
  }
  return undefined;
}

export function createAntigravityMessageRunner(
  bin: string,
  opts: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {},
): AntigravityMessageRunner {
  const timeoutMs = opts.timeoutMs ?? ANTIGRAVITY_TIMEOUT_MS;
  return (job) =>
    new Promise<AntigravityMessageResult>((done) => {
      if (!job.conversationId?.trim()) return done({ ok: false, error: tr('id de conversa do Antigravity inválido') });
      const env = opts.env ?? process.env;
      const args = ['send-message', job.conversationId, job.text];
      try {
        execFile(
          bin,
          args,
          {
            env,
            timeout: timeoutMs,
            maxBuffer: 256 * 1024,
            windowsHide: true,
            encoding: 'utf8',
            shell: process.platform === 'win32',
          },
          (err, _stdout, stderr) => {
            if (!err) return done({ ok: true });
            const e = err as NodeJS.ErrnoException & { killed?: boolean };
            if (e.killed) return done({ ok: false, error: tr('o Antigravity não respondeu em {0} s', [Math.round(timeoutMs / 1_000)]) });
            done({ ok: false, error: stderr?.trim() || tr('falha ao enviar mensagem ao Antigravity') });
          },
        );
      } catch (err) {
        done({ ok: false, error: String(err) });
      }
    });
}
