import { ChildProcess, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addToList, readEnvValue, updateEnv } from './envfile';
import { hashPassword } from './password';
import { tr } from '../../shared/i18n';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const ENV_FILE = join(ROOT, '.env');
const BIN_DIR = join(ROOT, 'bin');
const CLOUDFLARED_EXE = join(BIN_DIR, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');

const DEFAULT_USER = 'admin';
const DEFAULT_PASSWORD = 'habblaud12345';

export interface TunnelStatus {
  active: boolean;
  starting: boolean;
  url: string | null;
  user: string;
  pass: string;
  error: string | null;
}

export class TunnelService {
  private proc: ChildProcess | null = null;
  private statusState: TunnelStatus = {
    active: false,
    starting: false,
    url: null,
    user: DEFAULT_USER,
    pass: DEFAULT_PASSWORD,
    error: null,
  };
  private onCredentialsChanged?: (user: string, hash: string) => void;

  constructor(onCredentialsChanged?: (user: string, hash: string) => void) {
    this.onCredentialsChanged = onCredentialsChanged;
    this.readCredentials();
  }

  private readCredentials(): { user: string; pass: string } {
    if (existsSync(ENV_FILE)) {
      const env = readFileSync(ENV_FILE, 'utf8');
      const u = readEnvValue(env, 'HABBLAUD_REMOTE_USER');
      const p = readEnvValue(env, 'HABBLAUD_TUNNEL_PASSWORD');
      if (u) this.statusState.user = u;
      if (p) this.statusState.pass = p;
    }
    return { user: this.statusState.user, pass: this.statusState.pass };
  }

  status(): TunnelStatus {
    return { ...this.statusState };
  }

  async ensureEnv(): Promise<{ user: string; pass: string }> {
    let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
    let user = readEnvValue(env, 'HABBLAUD_REMOTE_USER') || DEFAULT_USER;
    let pass = readEnvValue(env, 'HABBLAUD_TUNNEL_PASSWORD') || DEFAULT_PASSWORD;
    const hasHash = !!readEnvValue(env, 'HABBLAUD_REMOTE_PASSWORD_HASH');

    if (!hasHash) {
      const hash = await hashPassword(pass);
      env = updateEnv(env, {
        HABBLAUD_REMOTE_USER: user,
        HABBLAUD_REMOTE_PASSWORD_HASH: hash,
        HABBLAUD_TUNNEL_PASSWORD: pass,
      });
    } else if (!readEnvValue(env, 'HABBLAUD_TUNNEL_PASSWORD')) {
      env = updateEnv(env, {
        HABBLAUD_TUNNEL_PASSWORD: pass,
      });
    }

    const allowedHosts = addToList(readEnvValue(env, 'HABBLAUD_ALLOWED_HOSTS'), '*.trycloudflare.com', 'habblaud.local', 'localhost');
    env = updateEnv(env, {
      HABBLAUD_ALLOWED_HOSTS: allowedHosts,
      HABBLAUD_REMOTE_ALLOW: 'permissions,messages,terminal,spawn',
      HABBLAUD_REMOTE_PORT: '4748',
      HABBLAUD_REMOTE_INSECURE_HTTP: '1',
    });

    writeFileSync(ENV_FILE, env, 'utf8');
    this.statusState.user = user;
    this.statusState.pass = pass;
    return { user, pass };
  }

  async updateCredentials(user: string, pass: string): Promise<TunnelStatus> {
    const trimmedUser = user.trim();
    const trimmedPass = pass.trim();
    if (!trimmedUser) throw new Error(tr('O nome de usuário não pode ficar vazio'));
    if (!trimmedPass || trimmedPass.length < 4) throw new Error(tr('A senha deve ter pelo menos 4 caracteres'));

    const hash = await hashPassword(trimmedPass);
    let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
    env = updateEnv(env, {
      HABBLAUD_REMOTE_USER: trimmedUser,
      HABBLAUD_REMOTE_PASSWORD_HASH: hash,
      HABBLAUD_TUNNEL_PASSWORD: trimmedPass,
    });
    writeFileSync(ENV_FILE, env, 'utf8');

    process.env.HABBLAUD_REMOTE_USER = trimmedUser;
    process.env.HABBLAUD_REMOTE_PASSWORD_HASH = hash;
    process.env.HABBLAUD_TUNNEL_PASSWORD = trimmedPass;

    this.statusState.user = trimmedUser;
    this.statusState.pass = trimmedPass;

    this.onCredentialsChanged?.(trimmedUser, hash);

    return this.status();
  }

  async ensureBinary(): Promise<string> {
    if (existsSync(CLOUDFLARED_EXE)) return CLOUDFLARED_EXE;
    mkdirSync(BIN_DIR, { recursive: true });

    let downloadUrl = '';
    if (process.platform === 'win32') {
      downloadUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
    } else if (process.platform === 'darwin') {
      downloadUrl = process.arch === 'arm64'
        ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64'
        : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64';
    } else {
      downloadUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';
    }

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Không tải được cloudflared (${res.statusText})`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(CLOUDFLARED_EXE, buf, { mode: 0o755 });
    return CLOUDFLARED_EXE;
  }

  async start(): Promise<TunnelStatus> {
    if (this.statusState.active && this.statusState.url) {
      return this.status();
    }
    if (this.statusState.starting) {
      throw new Error('Đường hầm đang được khởi tạo, vui lòng chờ...');
    }

    this.statusState.starting = true;
    this.statusState.error = null;

    try {
      const binary = await this.ensureBinary();
      const { user, pass } = await this.ensureEnv();

      return await new Promise<TunnelStatus>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!this.statusState.active) {
            this.stop();
            const err = 'Quá thời gian kết nối Cloudflare Tunnel (timeout)';
            this.statusState.error = err;
            this.statusState.starting = false;
            reject(new Error(err));
          }
        }, 35000);

        this.proc = spawn(binary, ['tunnel', '--url', 'http://127.0.0.1:4748'], {
          stdio: ['ignore', 'pipe', 'pipe'],
        });

        const onData = (chunk: Buffer) => {
          const text = chunk.toString();
          const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
          if (match && !this.statusState.active) {
            clearTimeout(timeout);
            this.statusState.active = true;
            this.statusState.starting = false;
            this.statusState.url = match[0];
            this.statusState.user = user;
            this.statusState.pass = pass;
            resolve(this.status());
          }
        };

        this.proc.stdout?.on('data', onData);
        this.proc.stderr?.on('data', onData);

        this.proc.on('error', (err) => {
          clearTimeout(timeout);
          this.statusState.starting = false;
          this.statusState.active = false;
          this.statusState.error = err.message;
          reject(err);
        });

        this.proc.on('close', (code) => {
          this.statusState.active = false;
          this.statusState.starting = false;
          this.statusState.url = null;
          this.proc = null;
        });
      });
    } catch (err: any) {
      this.statusState.starting = false;
      this.statusState.active = false;
      this.statusState.error = err?.message || String(err);
      throw err;
    }
  }

  async stop(): Promise<TunnelStatus> {
    if (this.proc) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(this.proc.pid), '/f', '/t']);
        } else {
          this.proc.kill('SIGTERM');
        }
      } catch {
        // Ignora erro de finalização
      }
      this.proc = null;
    }
    this.statusState.active = false;
    this.statusState.starting = false;
    this.statusState.url = null;
    return this.status();
  }
}
