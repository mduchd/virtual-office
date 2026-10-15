// Sprites procedurais da área externa (árvores, arbustos, postes, carros...) e utilitários
// visuais do mundo (sombra, brilhos). Mesma direção de arte do módulo de arte: contorno
// cinza-azulado escuro, 3–4 tons por material, luz vinda de cima/esquerda.
import { mulberry32 } from '../../../../shared/hash';
import type { ExteriorProp } from '../layout/types';

export interface PropSprite {
  canvas: HTMLCanvasElement;
  ax: number;
  ay: number;
}

const cache = new Map<string, PropSprite>();

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Pintor por pixel (ImageData) para formas orgânicas. */
class Painter {
  readonly data: ImageData;
  constructor(
    readonly ctx: CanvasRenderingContext2D,
    readonly w: number,
    readonly h: number,
  ) {
    // parte do conteúdo já desenhado (ex.: sombra) para não apagá-lo no putImageData
    this.data = ctx.getImageData(0, 0, w, h);
  }
  set(x: number, y: number, color: string, a = 255): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b] = hex(color);
    const i = (y * this.w + x) * 4;
    this.data.data[i] = r;
    this.data.data[i + 1] = g;
    this.data.data[i + 2] = b;
    this.data.data[i + 3] = a;
  }
  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data.data[(y * this.w + x) * 4 + 3];
  }
  flush(): void {
    this.ctx.putImageData(this.data, 0, 0);
  }
}

function shadowEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, a = 0.22): void {
  ctx.fillStyle = `rgba(28,36,52,${a})`;
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    ctx.fillRect(cx - half, cy + y, half * 2, 1);
  }
}

/** Copa arredondada: união de círculos com sombreamento por luz superior-esquerda. */
function canopy(p: Painter, rng: () => number, cx: number, cy: number, r: number, tones: string[], outline: string): void {
  const blobs: [number, number, number][] = [[cx, cy, r]];
  for (let i = 0; i < 4; i++) {
    const a = rng() * Math.PI * 2;
    const d = r * (0.35 + rng() * 0.35);
    blobs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, r * (0.55 + rng() * 0.25)]);
  }
  const inside = (x: number, y: number) => blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br);
  const x0 = Math.floor(cx - r * 1.8);
  const x1 = Math.ceil(cx + r * 1.8);
  const y0 = Math.floor(cy - r * 1.6);
  const y1 = Math.ceil(cy + r * 1.6);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!inside(x + 0.5, y + 0.5)) continue;
      const edge = !inside(x - 0.5, y + 0.5) || !inside(x + 1.5, y + 0.5) || !inside(x + 0.5, y - 0.5) || !inside(x + 0.5, y + 1.5);
      if (edge) {
        p.set(x, y, outline);
        continue;
      }
      // luz: topo-esquerda mais claro; ruído para "folhas"
      const nx = (x - cx) / r;
      const ny = (y - cy) / r;
      const light = -nx * 0.45 - ny * 0.75 + (rng() - 0.5) * 0.55;
      const k = light > 0.55 ? 3 : light > 0.05 ? 2 : light > -0.5 ? 1 : 0;
      p.set(x, y, tones[k]);
    }
  }
}

function treeSprite(seed: number): PropSprite {
  const rng = mulberry32(seed);
  const [c, ctx] = makeCanvas(36, 48);
  shadowEllipse(ctx, 18, 45, 12, 3, 0.25);
  const p = new Painter(ctx, 36, 48);
  // tronco
  for (let y = 30; y < 46; y++) {
    for (let x = 16; x < 21; x++) {
      const col = x === 16 ? '#8a6243' : x === 20 ? '#4a3222' : '#6b4a32';
      p.set(x, y, col);
    }
  }
  p.set(15, 45, '#4a3222');
  p.set(21, 45, '#4a3222');
  const variants = [
    ['#2f6a43', '#3f8550', '#5aa45d', '#86c873'],
    ['#356b3c', '#4b8a45', '#6aa956', '#9fcf74'],
    ['#2c6250', '#3a7e5f', '#53a071', '#82c489'],
  ];
  canopy(p, rng, 18, 18, 11 + Math.floor(rng() * 3), variants[Math.floor(rng() * variants.length)], '#25463a');
  p.flush();
  return { canvas: c, ax: 18, ay: 45 };
}

function pineSprite(seed: number): PropSprite {
  const rng = mulberry32(seed);
  const [c, ctx] = makeCanvas(28, 48);
  shadowEllipse(ctx, 14, 45, 9, 3, 0.25);
  const p = new Painter(ctx, 28, 48);
  for (let y = 38; y < 46; y++) for (let x = 12; x < 16; x++) p.set(x, y, x === 12 ? '#8a6243' : x === 15 ? '#4a3222' : '#6b4a32');
  const tones = ['#24533f', '#2f6b4f', '#3f8a5f', '#62ab79'];
  const layers = 4;
  for (let l = 0; l < layers; l++) {
    const top = 4 + l * 8;
    const bottom = top + 14;
    for (let y = top; y < bottom; y++) {
      const half = Math.round(((y - top) / (bottom - top)) * (5 + l * 2.2));
      for (let x = 14 - half; x <= 14 + half; x++) {
        const edge = x === 14 - half || x === 14 + half || y === bottom - 1;
        const light = (14 - x) / (half + 1) - (y - top) / (bottom - top) + (rng() - 0.5) * 0.5;
        p.set(x, y, edge ? '#1d3f33' : tones[light > 0.5 ? 3 : light > -0.1 ? 2 : light > -0.6 ? 1 : 0]);
      }
    }
  }
  p.flush();
  return { canvas: c, ax: 14, ay: 45 };
}

function bushSprite(seed: number): PropSprite {
  const rng = mulberry32(seed);
  const [c, ctx] = makeCanvas(22, 16);
  shadowEllipse(ctx, 11, 14, 9, 2, 0.22);
  const p = new Painter(ctx, 22, 16);
  canopy(p, rng, 11, 9, 6, ['#34663f', '#47864c', '#62a45a', '#8cc66f'], '#264a36');
  // florzinhas
  if (rng() < 0.6) {
    const col = ['#f2d14b', '#f28aa5', '#ffffff'][Math.floor(rng() * 3)];
    for (let i = 0; i < 4; i++) p.set(6 + Math.floor(rng() * 10), 5 + Math.floor(rng() * 6), col);
  }
  p.flush();
  return { canvas: c, ax: 11, ay: 14 };
}

function flowersSprite(seed: number): PropSprite {
  const rng = mulberry32(seed);
  const [c, ctx] = makeCanvas(30, 14);
  const p = new Painter(ctx, 30, 14);
  // canteiro: borda de pedra + terra
  for (let y = 4; y < 13; y++) {
    for (let x = 1; x < 29; x++) {
      const border = y === 4 || y === 12 || x === 1 || x === 28;
      p.set(x, y, border ? (y === 12 ? '#8d8a82' : '#b9b5aa') : '#6a4b35');
    }
  }
  const cols = ['#e8574a', '#f2c94c', '#f08bb0', '#ffffff', '#9b7be0'];
  for (let i = 0; i < 26; i++) {
    const x = 3 + Math.floor(rng() * 24);
    const y = 2 + Math.floor(rng() * 9);
    p.set(x, y + 1, '#3f8550');
    p.set(x, y, rng() < 0.75 ? cols[Math.floor(rng() * cols.length)] : '#5aa45d');
  }
  p.flush();
  return { canvas: c, ax: 15, ay: 13 };
}

function hedgeSprite(seed: number): PropSprite {
  const rng = mulberry32(seed);
  const [c, ctx] = makeCanvas(34, 16);
  shadowEllipse(ctx, 17, 14, 15, 2, 0.2);
  const p = new Painter(ctx, 34, 16);
  for (let y = 3; y < 14; y++) {
    for (let x = 1; x < 33; x++) {
      const r = y === 3 ? 2 : y === 4 ? 1 : 0;
      if (x < 1 + r || x > 32 - r) continue;
      const edge = y === 3 || y === 13 || x === 1 + r || x === 32 - r;
      const light = -(y - 3) / 10 + (rng() - 0.5) * 0.6;
      p.set(x, y, edge ? '#264a36' : light > 0 ? '#6aa956' : light > -0.4 ? '#4b8a45' : '#356b3c');
    }
  }
  p.flush();
  return { canvas: c, ax: 17, ay: 14 };
}

function lampSprite(): PropSprite {
  const [c, ctx] = makeCanvas(10, 36);
  shadowEllipse(ctx, 5, 34, 4, 1, 0.25);
  ctx.fillStyle = '#2e3648';
  ctx.fillRect(4, 6, 2, 28);
  ctx.fillStyle = '#4a5468';
  ctx.fillRect(4, 6, 1, 28);
  ctx.fillStyle = '#2e3648';
  ctx.fillRect(1, 2, 8, 5);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(2, 4, 6, 2);
  ctx.fillStyle = '#fff6d6';
  ctx.fillRect(3, 4, 2, 1);
  ctx.fillStyle = '#3a4152';
  ctx.fillRect(3, 32, 4, 2);
  return { canvas: c, ax: 5, ay: 34 };
}

function benchSprite(): PropSprite {
  const [c, ctx] = makeCanvas(26, 14);
  shadowEllipse(ctx, 13, 12, 11, 2, 0.22);
  ctx.fillStyle = '#2e3648';
  ctx.fillRect(3, 8, 2, 4);
  ctx.fillRect(21, 8, 2, 4);
  // encosto e assento em ripas
  ctx.fillStyle = '#7a5232';
  ctx.fillRect(1, 1, 24, 3);
  ctx.fillRect(1, 6, 24, 3);
  ctx.fillStyle = '#a0703f';
  ctx.fillRect(1, 1, 24, 1);
  ctx.fillRect(1, 6, 24, 1);
  ctx.fillStyle = '#5b3c25';
  ctx.fillRect(1, 8, 24, 1);
  ctx.fillRect(1, 3, 24, 1);
  return { canvas: c, ax: 13, ay: 12 };
}

function rockSprite(seed: number): PropSprite {
  const rng = mulberry32(seed);
  const [c, ctx] = makeCanvas(16, 12);
  const p = new Painter(ctx, 16, 12);
  canopy(p, rng, 8, 7, 4, ['#7d8590', '#959da8', '#b3bac4', '#d3d8de'], '#4d5562');
  p.flush();
  return { canvas: c, ax: 8, ay: 11 };
}

/** Mesa de jardim com guarda-sol listrado (vista de cima, 3/4) e duas cadeirinhas. */
function parasolSprite(seed: number): PropSprite {
  const [c, ctx] = makeCanvas(32, 34);
  const palettes: [string, string, string][] = [
    ['#e8574a', '#f6efe2', '#a83a33'],
    ['#2fb3a3', '#f6efe2', '#1f8579'],
    ['#f2b33d', '#fbf4e4', '#c88a1f'],
  ];
  const [a, b, dk] = palettes[seed % palettes.length];
  // sombra do guarda-sol no chão
  shadowEllipse(ctx, 16, 29, 12, 3, 0.24);
  // cadeirinhas (laterais) e mesa
  ctx.fillStyle = '#5b3c25';
  ctx.fillRect(2, 24, 6, 5);
  ctx.fillRect(24, 24, 6, 5);
  ctx.fillStyle = '#a0703f';
  ctx.fillRect(2, 24, 6, 2);
  ctx.fillRect(24, 24, 6, 2);
  ctx.fillStyle = '#d8dde3';
  ctx.fillRect(10, 24, 12, 5);
  ctx.fillStyle = '#f4f6f8';
  ctx.fillRect(10, 24, 12, 2);
  ctx.fillStyle = '#8d96a3';
  ctx.fillRect(10, 28, 12, 1);
  // haste
  ctx.fillStyle = '#4a5468';
  ctx.fillRect(15, 11, 2, 14);
  // lona: octógono achatado com gomos alternados e borda escura
  const p = new Painter(ctx, 32, 34);
  const cx = 15.5;
  const cy = 8;
  for (let y = 0; y <= 15; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = (x - cx) / 14.5;
      const dy = (y - cy) / 7.5;
      const d = Math.abs(dx) + Math.abs(dy) * 0.55 + Math.hypot(dx, dy) * 0.45;
      if (d > 1) continue;
      const ang = Math.atan2(y - cy, x - cx);
      const gomo = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 8) % 2;
      const edge = d > 0.86;
      const lit = y < cy - 1;
      p.set(x, y, edge ? dk : gomo ? (lit ? '#ffffff' : b) : lit ? a : dk);
    }
  }
  p.set(15, 8, '#2e3648');
  p.set(16, 8, '#2e3648');
  p.flush();
  return { canvas: c, ax: 16, ay: 29 };
}

/** Totem da entrada com a marca (azul-marinho e laranja, como a placa da recepção). */
function totemSprite(): PropSprite {
  const [c, ctx] = makeCanvas(14, 34);
  shadowEllipse(ctx, 7, 32, 6, 1.5, 0.25);
  ctx.fillStyle = '#141b30';
  ctx.fillRect(2, 2, 10, 30);
  ctx.fillStyle = '#1c2541';
  ctx.fillRect(3, 3, 8, 28);
  ctx.fillStyle = '#2a355a';
  ctx.fillRect(3, 3, 1, 28);
  // faixa laranja no topo, "H" claro e "b" laranja (as cores de "Hab" e "blaud" na placa)
  ctx.fillStyle = '#f2a33a';
  ctx.fillRect(3, 5, 8, 2);
  ctx.fillStyle = '#f5f1e6';
  ctx.fillRect(4, 11, 1, 6);
  ctx.fillRect(8, 11, 1, 6);
  ctx.fillRect(5, 13, 3, 1);
  ctx.fillStyle = '#f2a33a';
  ctx.fillRect(5, 19, 1, 6);
  ctx.fillRect(6, 21, 2, 1);
  ctx.fillRect(8, 22, 1, 2);
  ctx.fillRect(6, 24, 2, 1);
  // base
  ctx.fillStyle = '#8d96a3';
  ctx.fillRect(1, 31, 12, 2);
  return { canvas: c, ax: 7, ay: 32 };
}

/** Đài phun nước hoàng gia cỡ lớn (Grand Fountain) với 3 tầng nước tràn và cột phun bọt trắng */
function fountainSprite(seed: number): PropSprite {
  const [c, ctx] = makeCanvas(52, 38);
  shadowEllipse(ctx, 26, 33, 24, 5, 0.28);
  const out = '#2b3342';
  const stoneDk = '#525d6e';
  const stoneMid = '#788596';
  const stoneLit = '#b2becd';
  const stoneHi = '#e4eaf2';

  // 1. Bể đá hoa cương lớn bên ngoài (hình oval đáy)
  ctx.fillStyle = out;
  ctx.beginPath();
  ctx.ellipse(26, 25, 24, 10.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = stoneMid;
  ctx.beginPath();
  ctx.ellipse(26, 24, 23, 9.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bờ viền đá hướng sáng phía trên-trái
  ctx.fillStyle = stoneLit;
  ctx.beginPath();
  ctx.ellipse(25, 23, 22, 9, 0, Math.PI * 0.85, Math.PI * 1.95);
  ctx.fill();

  ctx.fillStyle = stoneHi;
  ctx.beginPath();
  ctx.ellipse(25, 22.5, 21, 8.2, 0, Math.PI * 1.05, Math.PI * 1.75);
  ctx.fill();

  // 2. Lòng hồ nước trong xanh
  ctx.fillStyle = '#144c70';
  ctx.beginPath();
  ctx.ellipse(26, 24, 19, 7.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2178ad';
  ctx.beginPath();
  ctx.ellipse(25.5, 23.5, 17, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mặt nước phản quang & các gợn sóng lăn tăn
  ctx.fillStyle = '#4fa8de';
  ctx.fillRect(14, 22, 7, 1);
  ctx.fillRect(31, 24, 8, 1);
  ctx.fillRect(20, 27, 12, 1);
  ctx.fillStyle = '#9fe0fc';
  ctx.fillRect(16, 23, 4, 1);
  ctx.fillRect(33, 25, 4, 1);

  // 3. Trụ đài phun nước trung tâm (Tầng 1)
  ctx.fillStyle = out;
  ctx.fillRect(21, 17, 10, 8);
  ctx.fillStyle = stoneDk;
  ctx.fillRect(22, 17, 8, 8);
  ctx.fillStyle = stoneMid;
  ctx.fillRect(22, 17, 6, 8);
  ctx.fillStyle = stoneHi;
  ctx.fillRect(22, 17, 2, 8);

  // Đĩa nước tầng giữa (Tầng 2)
  ctx.fillStyle = out;
  ctx.fillRect(16, 15, 20, 4);
  ctx.fillStyle = stoneLit;
  ctx.fillRect(17, 15, 18, 3);
  ctx.fillStyle = stoneHi;
  ctx.fillRect(17, 15, 6, 1);

  // Dòng nước tràn đổ từ tầng giữa xuống hồ
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(18, 18, 2, 6);
  ctx.fillRect(32, 18, 2, 6);
  ctx.fillStyle = '#9fe0fc';
  ctx.fillRect(17, 19, 1, 5);
  ctx.fillRect(34, 19, 1, 5);

  // Trụ tầng trên (Tầng 3)
  ctx.fillStyle = stoneDk;
  ctx.fillRect(23, 11, 6, 5);
  ctx.fillStyle = stoneHi;
  ctx.fillRect(23, 11, 2, 5);

  // Chén phun nước đỉnh
  ctx.fillStyle = out;
  ctx.fillRect(20, 10, 12, 3);
  ctx.fillStyle = stoneLit;
  ctx.fillRect(21, 10, 10, 2);
  ctx.fillStyle = stoneHi;
  ctx.fillRect(21, 10, 3, 1);

  // 4. Cột nước phun bọt trắng xóa & tia nước bắn lên cao
  ctx.fillStyle = '#9fe0fc';
  ctx.fillRect(25, 3, 2, 8);
  ctx.fillRect(24, 5, 4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(25, 2, 2, 4);
  ctx.fillRect(23, 4, 1, 3);
  ctx.fillRect(28, 4, 1, 3);
  ctx.fillRect(22, 7, 1, 2);
  ctx.fillRect(29, 7, 1, 2);
  // Bọt nước rơi vương vãi
  ctx.fillRect(21, 12, 1, 1);
  ctx.fillRect(30, 12, 1, 1);
  ctx.fillRect(19, 16, 1, 1);
  ctx.fillRect(32, 16, 1, 1);

  return { canvas: c, ax: 26, ay: 33 };
}

/** Nhà chờ xe buýt hiện đại (Modern Bus Shelter) có mái kính và bản đồ lộ trình */
function busShelterSprite(seed: number): PropSprite {
  const [c, ctx] = makeCanvas(38, 32);
  shadowEllipse(ctx, 19, 29, 17, 3, 0.28);
  const steel = '#2a3342';
  const steelLit = '#4b5768';

  // Khung cột kim loại phía sau và bên hông
  ctx.fillStyle = steel;
  ctx.fillRect(4, 8, 2, 21);
  ctx.fillRect(28, 8, 2, 21);

  // Vách kính phía sau trong suốt
  ctx.fillStyle = 'rgba(215, 235, 248, 0.45)';
  ctx.fillRect(5, 10, 24, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(6, 10, 2, 18);

  // Bảng áp phích bản đồ xe buýt (Transit Route Map)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 12, 8, 10);
  ctx.fillStyle = '#e74c3c'; // Tuyến đỏ
  ctx.fillRect(9, 14, 6, 1);
  ctx.fillStyle = '#3498db'; // Tuyến xanh
  ctx.fillRect(9, 17, 6, 1);
  ctx.fillStyle = '#f1c40f'; // Tuyến vàng
  ctx.fillRect(12, 13, 1, 7);

  // Ghế ngồi bằng gỗ dài bên trong nhà chờ
  ctx.fillStyle = '#54361c';
  ctx.fillRect(17, 21, 11, 4);
  ctx.fillStyle = '#8b5a30';
  ctx.fillRect(17, 20, 11, 2);
  ctx.fillStyle = '#b67a44';
  ctx.fillRect(17, 20, 11, 1);
  // Chân ghế sắt
  ctx.fillStyle = steel;
  ctx.fillRect(18, 24, 1, 5);
  ctx.fillRect(26, 24, 1, 5);

  // Mái che dốc hiện đại phía trên
  ctx.fillStyle = steel;
  ctx.fillRect(2, 6, 30, 4);
  ctx.fillStyle = steelLit;
  ctx.fillRect(2, 6, 30, 1);
  ctx.fillRect(2, 6, 1, 4);
  // Tấm kính che nắng phía trước mái
  ctx.fillStyle = '#5dade2';
  ctx.fillRect(3, 7, 28, 1);

  // Biển báo trạm xe buýt hình tròn đứng cạnh (Bus Stop Pole Sign)
  ctx.fillStyle = steel;
  ctx.fillRect(33, 11, 1, 18);
  // Biển tròn vàng nổi bật
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(31, 7, 5, 5);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(32, 8, 3, 3);
  ctx.fillStyle = '#2980b9'; // Icon xe buýt mini
  ctx.fillRect(32, 9, 3, 2);

  return { canvas: c, ax: 19, ay: 29 };
}

/** Máy bán nước tự động phong cách pixel art hiện đại */
function vendingSprite(variant: number): PropSprite {
  const [c, ctx] = makeCanvas(22, 32);
  shadowEllipse(ctx, 11, 30, 9, 2.5, 0.28);
  const out = '#242a38';

  const palettes: [string, string, string][] = [
    ['#c93b32', '#eb6057', '#942620'], // Đỏ
    ['#2b6cb0', '#4f8edb', '#1c4978'], // Xanh dương
    ['#2e8555', '#48b879', '#1a5c37'], // Xanh lá
  ];
  const [base, lit, dk] = palettes[variant % palettes.length];

  // Thân máy
  ctx.fillStyle = out;
  ctx.fillRect(2, 2, 18, 28);
  ctx.fillStyle = base;
  ctx.fillRect(3, 3, 16, 26);
  ctx.fillStyle = lit;
  ctx.fillRect(3, 3, 1, 26);
  ctx.fillRect(3, 3, 16, 1);
  ctx.fillStyle = dk;
  ctx.fillRect(18, 3, 1, 26);

  // Bảng hiệu đèn sáng ở đỉnh máy
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(5, 5, 12, 3);
  ctx.fillStyle = lit;
  ctx.fillRect(7, 6, 8, 1);

  // Cửa kính trưng bày đồ uống (có đèn chiếu)
  ctx.fillStyle = '#161a22';
  ctx.fillRect(4, 9, 14, 11);
  ctx.fillStyle = '#222836';
  ctx.fillRect(5, 10, 12, 9);

  // Kệ lon nước hàng trên
  ctx.fillStyle = '#e74c3c'; // lon đỏ
  ctx.fillRect(6, 11, 2, 3);
  ctx.fillStyle = '#f1c40f'; // lon vàng
  ctx.fillRect(9, 11, 2, 3);
  ctx.fillStyle = '#2ecc71'; // lon xanh lá
  ctx.fillRect(12, 11, 2, 3);
  ctx.fillStyle = '#3498db'; // lon xanh dương
  ctx.fillRect(15, 11, 2, 3);

  // Kệ lon nước hàng dưới
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(6, 15, 2, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(9, 15, 2, 3);
  ctx.fillStyle = '#9b59b6';
  ctx.fillRect(12, 15, 2, 3);
  ctx.fillStyle = '#1abc9c';
  ctx.fillRect(15, 15, 2, 3);

  // Vệt chéo phản chiếu trên mặt kính
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(6, 10, 1, 1);
  ctx.fillRect(7, 11, 1, 1);
  ctx.fillRect(8, 12, 1, 1);

  // Khe nhét tiền & đèn LED xanh
  ctx.fillStyle = '#1a1f29';
  ctx.fillRect(5, 21, 5, 2);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(11, 21, 1, 1);

  // Cửa đẩy lấy đồ uống bên dưới
  ctx.fillStyle = '#1e2430';
  ctx.fillRect(5, 24, 12, 4);
  ctx.fillStyle = '#546074';
  ctx.fillRect(6, 25, 10, 1);

  // Chân máy
  ctx.fillStyle = '#3a4454';
  ctx.fillRect(4, 30, 3, 1);
  ctx.fillRect(15, 30, 3, 1);

  return { canvas: c, ax: 11, ay: 30 };
}

/** Bãi đỗ xe đạp với 2 chiếc xe đạp phong cách trẻ trung */
function bicyclesSprite(seed: number): PropSprite {
  const [c, ctx] = makeCanvas(32, 24);
  shadowEllipse(ctx, 16, 21, 14, 2.5, 0.22);
  const out = '#2b3240';
  const steel = '#8a94a6';

  // Khung giàn kim loại cắm xuống đất
  ctx.fillStyle = steel;
  ctx.fillRect(4, 12, 2, 8);
  ctx.fillRect(14, 12, 2, 8);
  ctx.fillRect(24, 12, 2, 8);
  ctx.fillRect(4, 12, 22, 2);

  // Xe đạp 1 (bên trái - màu cam thể thao)
  // Bánh trước & bánh sau
  ctx.fillStyle = out;
  ctx.fillRect(3, 14, 5, 5);
  ctx.fillRect(11, 14, 5, 5);
  ctx.fillStyle = '#b0b8c4';
  ctx.fillRect(4, 15, 3, 3);
  ctx.fillRect(12, 15, 3, 3);

  // Khung xe cam
  ctx.fillStyle = '#e65c36';
  ctx.fillRect(5, 13, 7, 2);
  ctx.fillRect(7, 11, 2, 4);
  ctx.fillRect(12, 11, 2, 5);

  // Yên xe & tay lái
  ctx.fillStyle = '#222834';
  ctx.fillRect(6, 10, 3, 1); // yên
  ctx.fillStyle = '#b0b8c4';
  ctx.fillRect(12, 9, 3, 2); // ghi-đông

  // Xe đạp 2 (bên phải - màu xanh mint)
  ctx.fillStyle = out;
  ctx.fillRect(17, 14, 5, 5);
  ctx.fillRect(25, 14, 5, 5);
  ctx.fillStyle = '#b0b8c4';
  ctx.fillRect(18, 15, 3, 3);
  ctx.fillRect(26, 15, 3, 3);

  // Khung xe xanh mint
  ctx.fillStyle = '#26b99a';
  ctx.fillRect(19, 13, 7, 2);
  ctx.fillRect(21, 11, 2, 4);
  ctx.fillRect(26, 11, 2, 5);

  // Yên xe & tay lái
  ctx.fillStyle = '#222834';
  ctx.fillRect(20, 10, 3, 1);
  ctx.fillStyle = '#b0b8c4';
  ctx.fillRect(26, 9, 3, 2);

  return { canvas: c, ax: 16, ay: 21 };
}

/** Thùng rác phân loại 2 ngăn (xanh dương & xanh lá) */
function trashSprite(): PropSprite {
  const [c, ctx] = makeCanvas(20, 20);
  shadowEllipse(ctx, 10, 17, 9, 2, 0.24);

  // Ngăn rác tái chế (Xanh dương)
  ctx.fillStyle = '#222938';
  ctx.fillRect(2, 6, 7, 11);
  ctx.fillStyle = '#2980b9';
  ctx.fillRect(3, 7, 5, 9);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(2, 5, 7, 2); // Nắp
  ctx.fillStyle = '#1a5276';
  ctx.fillRect(4, 8, 3, 2); // Cửa bỏ rác
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(5, 12, 1, 1); // Ký hiệu tái chế

  // Ngăn rác hữu cơ/thông thường (Xanh lá)
  ctx.fillStyle = '#222938';
  ctx.fillRect(11, 6, 7, 11);
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(12, 7, 5, 9);
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(11, 5, 7, 2); // Nắp
  ctx.fillStyle = '#196f3d';
  ctx.fillRect(13, 8, 3, 2); // Cửa bỏ rác
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(14, 12, 1, 1);

  // Khung đế nối chân
  ctx.fillStyle = '#546074';
  ctx.fillRect(1, 16, 18, 1);

  return { canvas: c, ax: 10, ay: 17 };
}

/** Chú mèo đáng yêu nằm ngủ dưới tán cây / ghế đá */
function catSprite(seed: number): PropSprite {
  const [c, ctx] = makeCanvas(18, 14);
  shadowEllipse(ctx, 9, 12, 7, 2, 0.2);

  const variant = seed % 3;
  if (variant === 0) {
    // Mèo vàng cam (Ginger tabby) cuộn tròn ngủ say
    ctx.fillStyle = '#d35400';
    ctx.beginPath();
    ctx.ellipse(9, 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.ellipse(9, 7.5, 5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bụng trắng kem
    ctx.fillStyle = '#fef5e7';
    ctx.fillRect(7, 8, 3, 2);

    // Tai mèo
    ctx.fillStyle = '#d35400';
    ctx.fillRect(5, 4, 2, 2);
    ctx.fillRect(11, 4, 2, 2);
    ctx.fillStyle = '#f5b7b1';
    ctx.fillRect(6, 5, 1, 1);
    ctx.fillRect(11, 5, 1, 1);

    // Mắt khép hờ ngủ ngon
    ctx.fillStyle = '#78281f';
    ctx.fillRect(6, 7, 2, 1);
    ctx.fillRect(10, 7, 2, 1);

    // Đuôi cuộn bên hông
    ctx.fillStyle = '#ba4a00';
    ctx.fillRect(14, 8, 2, 3);
    ctx.fillRect(13, 10, 2, 1);
  } else if (variant === 1) {
    // Mèo tam thể (Calico)
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.ellipse(9, 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbfcfc';
    ctx.beginPath();
    ctx.ellipse(9, 7.5, 5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đốm cam & đen
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(6, 6, 3, 3);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(11, 6, 3, 3);

    // Tai mèo
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(5, 4, 2, 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(11, 4, 2, 2);

    // Mắt nhắm
    ctx.fillStyle = '#1c2833';
    ctx.fillRect(7, 7, 1, 1);
    ctx.fillRect(10, 7, 1, 1);
  } else {
    // Mèo xám sọc ngủ ngoan
    ctx.fillStyle = '#566573';
    ctx.beginPath();
    ctx.ellipse(9, 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a6acaf';
    ctx.beginPath();
    ctx.ellipse(9, 7.5, 5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vằn xám đậm
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(8, 5, 2, 1);
    ctx.fillRect(7, 7, 1, 2);
    ctx.fillRect(10, 7, 1, 2);

    // Tai
    ctx.fillStyle = '#566573';
    ctx.fillRect(5, 4, 2, 2);
    ctx.fillRect(11, 4, 2, 2);
  }

  return { canvas: c, ax: 9, ay: 12 };
}

/** Phiến đá dạo bước tự nhiên trên thảm cỏ */
function steppingStonesSprite(seed: number): PropSprite {
  const [c, ctx] = makeCanvas(26, 16);
  const out = '#343c4a';
  const stone = '#7d8590';
  const lit = '#b3bac4';

  const stones: [number, number, number, number][] = [
    [5, 4, 4, 2.5],
    [13, 8, 5, 3],
    [20, 4, 4, 2.5],
  ];

  for (const [cx, cy, rx, ry] of stones) {
    shadowEllipse(ctx, cx, cy + ry, rx + 1, 1.5, 0.2);
    ctx.fillStyle = out;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = stone;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 0.5, rx - 0.8, ry - 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lit;
    ctx.beginPath();
    ctx.ellipse(cx - 0.6, cy - 1, rx - 1.8, ry - 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return { canvas: c, ax: 13, ay: 13 };
}

export function propSprite(prop: ExteriorProp): PropSprite {
  const key =
    prop.kind === 'lamp' || prop.kind === 'bench' || prop.kind === 'totem' || prop.kind === 'trash'
      ? prop.kind
      : `${prop.kind}:${prop.seed % 7}`;
  let s = cache.get(key);
  if (s) return s;
  switch (prop.kind) {
    case 'tree':
      s = treeSprite(prop.seed % 7);
      break;
    case 'pine':
      s = pineSprite(prop.seed % 7);
      break;
    case 'bush':
      s = bushSprite(prop.seed % 7);
      break;
    case 'flowers':
      s = flowersSprite(prop.seed % 7);
      break;
    case 'hedge':
      s = hedgeSprite(prop.seed % 7);
      break;
    case 'lamp':
      s = lampSprite();
      break;
    case 'bench':
      s = benchSprite();
      break;
    case 'rock':
      s = rockSprite(prop.seed % 7);
      break;
    case 'parasol':
      s = parasolSprite(prop.seed % 7);
      break;
    case 'totem':
      s = totemSprite();
      break;
    case 'fountain':
      s = fountainSprite(prop.seed);
      break;
    case 'vending':
      s = vendingSprite(prop.seed);
      break;
    case 'bicycles':
      s = bicyclesSprite(prop.seed);
      break;
    case 'trash':
      s = trashSprite();
      break;
    case 'cat':
      s = catSprite(prop.seed);
      break;
    case 'stepping_stones':
      s = steppingStonesSprite(prop.seed);
      break;
    case 'bus_shelter':
      s = busShelterSprite(prop.seed);
      break;
    default:
      // 'paving' e outros tipos desenhados pelo próprio renderer
      s = { canvas: makeCanvas(1, 1)[0], ax: 0, ay: 0 };
  }
  cache.set(key, s);
  return s;
}

const CAR_COLORS: [string, string, string][] = [
  ['#d9534a', '#a83a33', '#f08a80'],
  ['#3f7fd8', '#2c5ea6', '#7fb0f0'],
  ['#f2f2ee', '#c4c6c8', '#ffffff'],
  ['#f2b33d', '#c88a1f', '#ffd889'],
  ['#2fb3a3', '#1f8579', '#79dccf'],
  ['#4a5468', '#323a4a', '#76819a'],
];

/** Carro visto de lado (3/4), virado para a direita; `flip` desenha para a esquerda. */
export function carSprite(variant: number, flip: boolean): PropSprite {
  const key = `car:${variant % CAR_COLORS.length}:${flip ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [body, dark, light] = CAR_COLORS[variant % CAR_COLORS.length];
  const [c, ctx] = makeCanvas(36, 20);
  if (flip) {
    ctx.translate(36, 0);
    ctx.scale(-1, 1);
  }
  shadowEllipse(ctx, 18, 17, 16, 2, 0.3);
  const o = '#2e3648';
  // carroceria
  ctx.fillStyle = o;
  ctx.fillRect(2, 8, 32, 8);
  ctx.fillRect(8, 3, 18, 6);
  ctx.fillStyle = body;
  ctx.fillRect(3, 9, 30, 6);
  ctx.fillRect(9, 4, 16, 5);
  ctx.fillStyle = light;
  ctx.fillRect(3, 9, 30, 1);
  ctx.fillRect(9, 4, 16, 1);
  ctx.fillStyle = dark;
  ctx.fillRect(3, 13, 30, 2);
  // vidros
  ctx.fillStyle = '#3a5f86';
  ctx.fillRect(10, 5, 6, 3);
  ctx.fillRect(18, 5, 6, 3);
  ctx.fillStyle = '#9cc7ec';
  ctx.fillRect(10, 5, 2, 1);
  ctx.fillRect(18, 5, 2, 1);
  // farol e lanterna
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(32, 10, 2, 2);
  ctx.fillStyle = '#e04a3a';
  ctx.fillRect(2, 10, 1, 2);
  // rodas
  for (const wx of [7, 25]) {
    ctx.fillStyle = o;
    ctx.fillRect(wx, 13, 5, 5);
    ctx.fillStyle = '#6b7385';
    ctx.fillRect(wx + 1, 14, 3, 3);
    ctx.fillStyle = '#9aa3b5';
    ctx.fillRect(wx + 2, 15, 1, 1);
  }
  const s = { canvas: c, ax: 18, ay: 17 };
  cache.set(key, s);
  return s;
}

/** Sombra de contato sob os personagens. */
export function shadowSprite(): PropSprite {
  const hit = cache.get('shadow');
  if (hit) return hit;
  const [c, ctx] = makeCanvas(14, 6);
  shadowEllipse(ctx, 7, 3, 6, 2, 0.28);
  const s = { canvas: c, ax: 7, ay: 3 };
  cache.set('shadow', s);
  return s;
}

/** Brilho radial (desenhado com composição aditiva). */
export function glowSprite(color: string, size = 64): HTMLCanvasElement {
  const key = `glow:${color}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit.canvas;
  const [c, ctx] = makeCanvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  const [r, gg, b] = hex(color);
  g.addColorStop(0, `rgba(${r},${gg},${b},0.9)`);
  g.addColorStop(0.4, `rgba(${r},${gg},${b},0.35)`);
  g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cache.set(key, { canvas: c, ax: size / 2, ay: size / 2 });
  return c;
}
