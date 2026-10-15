import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { AccountUsage } from '../../../shared/types';
import { log } from '../../log';

export const FIVE_HOURS_MS = 5 * 3600 * 1000;
export const WEEK_MS = 7 * 24 * 3600 * 1000;

export const DEFAULT_ANTIGRAVITY_5H_QUOTA = 8_000_000;
export const DEFAULT_ANTIGRAVITY_WEEK_QUOTA = 50_000_000;

export interface AntigravityUsageOptions {
  quota5h?: number;
  quotaWeek?: number;
}

/**
 * Calcula o uso da conta do Antigravity a partir dos transcripts recentes em brain/<id>/.system_generated/logs/transcript.jsonl.
 * Mede tokens consumidos na janela de 5 horas e de 7 dias, calculando percentual e horário de reinício da janela.
 */
export function calculateAntigravityUsage(
  homeDir: string,
  now: number = Date.now(),
  options: AntigravityUsageOptions = {}
): AccountUsage {
  const quota5h = options.quota5h ?? (Number(process.env.HABBLAUD_ANTIGRAVITY_5H_QUOTA) || DEFAULT_ANTIGRAVITY_5H_QUOTA);
  const quotaWeek = options.quotaWeek ?? (Number(process.env.HABBLAUD_ANTIGRAVITY_WEEK_QUOTA) || DEFAULT_ANTIGRAVITY_WEEK_QUOTA);

  const brainDir = join(homeDir, 'brain');
  let tokens5h = 0;
  let tokensWeek = 0;
  let oldest5h = now;
  let oldestWeek = now;

  if (existsSync(brainDir)) {
    let convIds: string[] = [];
    try {
      convIds = readdirSync(brainDir);
    } catch (err) {
      log.warnOnce('antigravity-brain-read', `Antigravity: erro ao ler pasta brain: ${String(err)}`);
    }

    for (const c of convIds) {
      const p = join(brainDir, c, '.system_generated', 'logs', 'transcript.jsonl');
      try {
        const st = statSync(p);
        if (now - st.mtimeMs > WEEK_MS) continue;

        const content = readFileSync(p, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const step = JSON.parse(line);
            if (!step.created_at) continue;
            const t = new Date(step.created_at).getTime();
            if (Number.isNaN(t)) continue;
            const diff = now - t;
            if (diff < 0) continue;

            const total = (step.input_tokens || 0) + (step.output_tokens || 0);

            if (diff <= FIVE_HOURS_MS) {
              tokens5h += total;
              if (t < oldest5h) oldest5h = t;
            }
            if (diff <= WEEK_MS) {
              tokensWeek += total;
              if (t < oldestWeek) oldestWeek = t;
            }
          } catch {
            // linha inválida, ignora
          }
        }
      } catch {
        // arquivo indisponível ou excluído
      }
    }
  }

  const resets5h = tokens5h > 0 && oldest5h < now ? oldest5h + FIVE_HOURS_MS : now + FIVE_HOURS_MS;
  const resetsWeek = tokensWeek > 0 && oldestWeek < now ? oldestWeek + WEEK_MS : now + WEEK_MS;

  const usage: AccountUsage = {
    source: 'antigravity',
    fetchedAt: now,
    fiveHour: {
      utilization: Math.min(100, Math.round((tokens5h / quota5h) * 100)),
      resetsAt: resets5h <= now ? now + FIVE_HOURS_MS : resets5h,
    },
    sevenDay: {
      utilization: Math.min(100, Math.round((tokensWeek / quotaWeek) * 100)),
      resetsAt: resetsWeek <= now ? now + WEEK_MS : resetsWeek,
    },
  };

  return usage;
}
