import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addToList, readEnvValue, updateEnv } from '../server/remote/envfile';
import { hashPassword } from '../server/remote/password';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const ENV_FILE = join(ROOT, '.env');
const BIN_DIR = join(ROOT, 'bin');
const CLOUDFLARED_EXE = join(BIN_DIR, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');

const DEFAULT_USER = 'admin';
const DEFAULT_PASSWORD = 'habblaud12345';

function isPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function ensureCloudflared(): Promise<string> {
  if (existsSync(CLOUDFLARED_EXE)) return CLOUDFLARED_EXE;
  mkdirSync(BIN_DIR, { recursive: true });
  console.log('[remote-tunnel] Đang tải cloudflared...');

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
  console.log('[remote-tunnel] Tải cloudflared thành công!');
  return CLOUDFLARED_EXE;
}

async function ensureEnv(): Promise<{ user: string; pass: string }> {
  let env = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';

  let user = readEnvValue(env, 'HABBLAUD_REMOTE_USER') || DEFAULT_USER;
  let hasHash = !!readEnvValue(env, 'HABBLAUD_REMOTE_PASSWORD_HASH');
  let pass = DEFAULT_PASSWORD;

  if (!hasHash) {
    console.log(`[remote-tunnel] Thiết lập tài khoản remote: ${user} / mật khẩu: ${pass}`);
    const hash = await hashPassword(pass);
    env = updateEnv(env, {
      HABBLAUD_REMOTE_USER: user,
      HABBLAUD_REMOTE_PASSWORD_HASH: hash,
    });
  }

  const allowedHosts = addToList(readEnvValue(env, 'HABBLAUD_ALLOWED_HOSTS'), '*.trycloudflare.com', 'habblaud.local', 'localhost');
  const allowFeatures = 'permissions,messages,terminal,spawn';

  env = updateEnv(env, {
    HABBLAUD_ALLOWED_HOSTS: allowedHosts,
    HABBLAUD_REMOTE_ALLOW: allowFeatures,
    HABBLAUD_REMOTE_PORT: '4748',
    HABBLAUD_REMOTE_INSECURE_HTTP: '1',
  });

  writeFileSync(ENV_FILE, env, 'utf8');
  return { user, pass };
}

async function main(): Promise<void> {
  const binary = await ensureCloudflared();
  const { user, pass } = await ensureEnv();

  const isUp = await isPortListening(4748);
  if (!isUp) {
    console.log('------------------------------------------------------------------------');
    console.log('⚠️  LƯU Ý: Habblaud chưa chạy trên cổng 4748!');
    console.log('👉 Hãy mở một Terminal khác và chạy: npm start (hoặc npm run docker:up)');
    console.log('------------------------------------------------------------------------\n');
  }

  console.log('[remote-tunnel] Đang khởi tạo Cloudflare Tunnel tới http://127.0.0.1:4748 ...');

  const proc = spawn(binary, ['tunnel', '--url', 'http://127.0.0.1:4748'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let tunnelUrlFound = false;

  const onData = (chunk: Buffer) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrlFound) {
      tunnelUrlFound = true;
      const url = match[0];

      console.log('\n========================================================================');
      console.log('🎉 ĐÃ KHỞI TẠO ĐƯỜNG HẦM TRUY CẬP TỪ XA THÀNH CÔNG!');
      console.log('========================================================================');
      console.log('\n📱 Mở đường link sau trên điện thoại (4G / 5G / Wi-Fi ở bất cứ đâu):');
      console.log(`\n   👉  \x1b[32m\x1b[1m${url}\x1b[0m  👈\n`);
      console.log(`👤 Tài khoản: \x1b[36m${user}\x1b[0m`);
      console.log(`🔑 Mật khẩu : \x1b[36m${pass}\x1b[0m`);
      console.log('\n✨ Đầy đủ quyền điều khiển:');
      console.log('   - Duyệt quyền khi Agent yêu cầu (Approve / Deny)');
      console.log('   - Nhắn tin ra lệnh tiếp theo cho Agent');
      console.log('   - Bấm nút [+] trên điện thoại để tạo Agent mới từ xa');
      console.log('========================================================================');
      console.log('💡 Giữ cửa sổ này mở để duy trì kết nối. Nhấn Ctrl + C để dừng.');
    }
  };

  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);

  proc.on('close', (code) => {
    console.log(`[remote-tunnel] Cloudflare tunnel đã đóng (mã ${code})`);
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[remote-tunnel] Lỗi:', err);
  process.exit(1);
});
