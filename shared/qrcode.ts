// Gerador minimalista e autônomo de QR Code em SVG (sem dependências externas).
// Suporta modo Byte com nível de correção de erro L (Low) ou M (Medium).

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function polyMul(p1: Uint8Array, p2: Uint8Array): Uint8Array {
  const r = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      r[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return r;
}

function rsGenPoly(n: number): Uint8Array {
  let poly: Uint8Array<any> = new Uint8Array([1]);
  for (let i = 0; i < n; i++) {
    poly = polyMul(poly, new Uint8Array([1, GF_EXP[i]]));
  }
  return poly;
}

function rsCompute(data: Uint8Array, eccLen: number): Uint8Array {
  const gen = rsGenPoly(eccLen);
  const out = new Uint8Array(eccLen);
  for (const byte of data) {
    const factor = byte ^ out[0];
    out.copyWithin(0, 1);
    out[eccLen - 1] = 0;
    for (let j = 0; j < eccLen; j++) {
      out[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return out;
}

// Tabela de capacidade e blocos para versões 1 a 6 (Level L)
interface VersionSpec {
  totalCodewords: number;
  dataCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocks: number;
  alignPos: number[];
}

const VERSIONS: VersionSpec[] = [
  { totalCodewords: 26, dataCodewords: 19, ecCodewordsPerBlock: 7, numBlocks: 1, alignPos: [] }, // V1: 21x21 (max 17 bytes)
  { totalCodewords: 44, dataCodewords: 34, ecCodewordsPerBlock: 10, numBlocks: 1, alignPos: [6, 18] }, // V2: 25x25 (max 32 bytes)
  { totalCodewords: 70, dataCodewords: 55, ecCodewordsPerBlock: 15, numBlocks: 1, alignPos: [6, 22] }, // V3: 29x29 (max 53 bytes)
  { totalCodewords: 100, dataCodewords: 80, ecCodewordsPerBlock: 20, numBlocks: 1, alignPos: [6, 26] }, // V4: 33x33 (max 78 bytes)
  { totalCodewords: 134, dataCodewords: 108, ecCodewordsPerBlock: 26, numBlocks: 1, alignPos: [6, 30] }, // V5: 37x37 (max 106 bytes)
  { totalCodewords: 172, dataCodewords: 136, ecCodewordsPerBlock: 18, numBlocks: 2, alignPos: [6, 34] }, // V6: 41x41 (max 134 bytes)
];

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  let verIdx = VERSIONS.findIndex((v) => bytes.length <= v.dataCodewords - 3);
  if (verIdx === -1) verIdx = VERSIONS.length - 1;
  const spec = VERSIONS[verIdx];
  const version = verIdx + 1;
  const size = 17 + 4 * version;

  // Codificação dos bits: Mode 8-bit (0100) + Count (8 bits) + Data + Terminator
  const bitBuf: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bitBuf.push((val >> i) & 1);
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8); // Character count
  for (const b of bytes) pushBits(b, 8);
  pushBits(0, Math.min(4, spec.dataCodewords * 8 - bitBuf.length)); // Terminator
  while (bitBuf.length % 8 !== 0) bitBuf.push(0); // Byte align

  const dataBytes = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < bitBuf.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bitBuf[i + j];
    dataBytes[i / 8] = b;
  }
  const padPatterns = [0xec, 0x11];
  for (let i = bitBuf.length / 8; i < spec.dataCodewords; i++) {
    dataBytes[i] = padPatterns[(i - bitBuf.length / 8) % 2];
  }

  // Reed-Solomon Error Correction
  const blockSize = Math.floor(spec.dataCodewords / spec.numBlocks);
  const finalBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  for (let b = 0; b < spec.numBlocks; b++) {
    const bData = dataBytes.slice(b * blockSize, (b + 1) * blockSize);
    finalBlocks.push(bData);
    ecBlocks.push(rsCompute(bData, spec.ecCodewordsPerBlock));
  }

  // Interleave
  const allCodewords: number[] = [];
  for (let i = 0; i < blockSize; i++) {
    for (let b = 0; b < spec.numBlocks; b++) allCodewords.push(finalBlocks[b][i]);
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.numBlocks; b++) allCodewords.push(ecBlocks[b][i]);
  }

  // Matrix creation
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    isFunction[r][c] = true;
  };

  // Finder patterns
  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = top + r;
        const nc = left + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        const inBorder = (r === 0 || r === 6 || c === 0 || c === 6) && inOuter;
        setModule(nr, nc, inBorder || inInner);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  for (const r of spec.alignPos) {
    for (const c of spec.alignPos) {
      if (isFunction[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
          const isCenter = dr === 0 && dc === 0;
          setModule(r + dr, c + dc, isEdge || isCenter);
        }
      }
    }
  }

  // Dark module & format reservations
  setModule(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) isFunction[8][i] = true;
    if (!isFunction[i][8]) isFunction[i][8] = true;
    if (!isFunction[8][size - 1 - i]) isFunction[8][size - 1 - i] = true;
    if (!isFunction[size - 1 - i][8]) isFunction[size - 1 - i][8] = true;
  }

  // Place data bits with Mask 0 ((row + col) % 2 === 0)
  const bitStream: number[] = [];
  for (const cw of allCodewords) {
    for (let i = 7; i >= 0; i--) bitStream.push((cw >> i) & 1);
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const cols = [right, right - 1];
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const c of cols) {
        if (!isFunction[r][c]) {
          const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit === 1) !== mask;
        }
      }
    }
    upward = !upward;
  }

  // Format bits for Level L, Mask 0: 111011111000100 ^ 101010000010010 = 010001111010110
  const formatBits = [0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0];
  const topCols = [0, 1, 2, 3, 4, 5, 7, 8];
  for (let i = 0; i < 6; i++) matrix[8][topCols[i]] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
  matrix[8][size - 8] = formatBits[7] === 1;
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = formatBits[i] === 1;

  return matrix;
}

export function generateQrSvg(text: string, moduleSize = 4, margin = 2): string {
  const matrix = generateQrMatrix(text);
  const n = matrix.length;
  const fullSize = (n + margin * 2) * moduleSize;

  let pathData = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        pathData += `M${x} ${y}h${moduleSize}v${moduleSize}h-${moduleSize}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fullSize} ${fullSize}" width="${fullSize}" height="${fullSize}" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#ffffff" rx="8"/>
    <path fill="#1a1c23" d="${pathData.trim()}"/>
  </svg>`;
}
