import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { expandHome, type DetectedAccount } from '../../accounts/detect';

function splitList(v: string | undefined): string[] {
  return (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** Tenta descobrir o e-mail do usuário autenticado no Antigravity a partir do app_storage.json do Electron. */
export function detectAntigravityEmail(env: NodeJS.ProcessEnv = process.env, home: string = env.HOME || homedir()): string | undefined {
  const candidates: string[] = [];
  if (env.APPDATA) {
    candidates.push(join(env.APPDATA, 'Antigravity', 'app_storage.json'));
  }
  candidates.push(
    join(home, 'Library', 'Application Support', 'Antigravity', 'app_storage.json'),
    join(home, '.config', 'Antigravity', 'app_storage.json'),
  );

  for (const c of candidates) {
    if (existsSync(c)) {
      try {
        const raw = readFileSync(c, 'utf8');
        const json = JSON.parse(raw);
        const username = json['jetski.onboarding.lastLoginUsername'];
        if (typeof username === 'string' && username.includes('@')) {
          return username.trim();
        }
      } catch {
        // ignora erro de leitura/parse
      }
    }
  }
  return undefined;
}

/** Verifica se a pasta tem a estrutura do Antigravity (Google DeepMind Antigravity). */
export function isAntigravityHome(p: string): boolean {
  if (!isDir(p)) return false;
  return (
    existsSync(join(p, 'conversation_summaries.db')) ||
    isDir(join(p, 'presence')) ||
    isDir(join(p, 'brain')) ||
    isDir(join(p, 'conversations'))
  );
}

/** Pastas padrão do Antigravity. */
export function defaultAntigravityDirs(env: NodeJS.ProcessEnv = process.env, home: string = env.HOME || homedir()): string[] {
  const dirs: string[] = [];
  const raw = env.ANTIGRAVITY_HOME?.trim();
  if (raw) dirs.push(expandHome(raw, home));

  if (env.USERPROFILE && env.USERPROFILE !== home) {
    dirs.push(join(env.USERPROFILE, '.gemini', 'antigravity'));
  }
  dirs.push(join(home, '.gemini', 'antigravity'));
  return dirs;
}

/** Descoberta das pastas do Antigravity observadas. */
export function discoverAntigravityDirs(env: NodeJS.ProcessEnv = process.env, home: string = env.HOME || homedir()): string[] {
  const override = splitList(env.HABBLAUD_ANTIGRAVITY_DIRS);
  if (override.length) {
    return [...new Set(override.map((p) => expandHome(p, home)))].filter(isDir);
  }

  const candidates = defaultAntigravityDirs(env, home);
  const found: string[] = [];
  for (const dir of candidates) {
    if (isAntigravityHome(dir)) {
      found.push(resolve(dir));
    }
  }

  return [...new Set(found)];
}

export function detectAntigravityAccounts(dirs: string[], env: NodeJS.ProcessEnv = process.env): DetectedAccount[] {
  const email = detectAntigravityEmail(env);
  return dirs.map((dir, idx) => {
    const id = dirs.length === 1 ? 'antigravity' : `antigravity-${idx + 1}`;
    const name = dirs.length === 1 ? 'Antigravity' : `Antigravity ${idx + 1}`;
    return {
      id,
      provider: 'antigravity',
      configDir: dir,
      short: 'AGY',
      name,
      email,
      color: '#8a5cf6',
      plan: 'Pro',
    };
  });
}
