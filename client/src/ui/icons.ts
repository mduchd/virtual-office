import type { Provider } from '../../../shared/types';

// Ícones da interface em pixel art (mapas de pixels -> SVG com bordas nítidas), coerentes com o escritório.
// Cada '#' é um pixel pintado com currentColor; renderizados a 2 px de tela por pixel.

function pixelPaths(rows: readonly string[], palette: Readonly<Record<string, string>>): string {
  let out = '';
  for (const [ch, color] of Object.entries(palette)) {
    let d = '';
    rows.forEach((row, y) => {
      // Agrupa pixels consecutivos da linha num único retângulo.
      let x = 0;
      while (x < row.length) {
        if (row[x] !== ch) {
          x++;
          continue;
        }
        let run = 1;
        while (row[x + run] === ch) run++;
        d += `M${x} ${y}h${run}v1h-${run}z`;
        x += run;
      }
    });
    if (d) out += `<path fill="${color}" d="${d}"/>`;
  }
  return out;
}

export function pixelIcon(rows: readonly string[], palette: Readonly<Record<string, string>> = { '#': 'currentColor' }, cls = 'ui-px-icon'): string {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return `<svg class="${cls}" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${pixelPaths(rows, palette)}</svg>`;
}

export const ICONS = {
  phone: pixelIcon([
    '..######..',
    '..#....#..',
    '..#....#..',
    '..#....#..',
    '..#....#..',
    '..#....#..',
    '..#....#..',
    '..#....#..',
    '..#.##.#..',
    '..######..',
  ]),
  overview: pixelIcon([
    '###....###',
    '#........#',
    '#........#',
    '...####...',
    '...#..#...',
    '...#..#...',
    '...####...',
    '#........#',
    '#........#',
    '###....###',
  ]),
  zoomIn: pixelIcon([
    '..........',
    '....##....',
    '....##....',
    '....##....',
    '.########.',
    '.########.',
    '....##....',
    '....##....',
    '....##....',
    '..........',
  ]),
  zoomOut: pixelIcon([
    '..........',
    '..........',
    '..........',
    '..........',
    '.########.',
    '.########.',
    '..........',
    '..........',
    '..........',
    '..........',
  ]),
  sidebar: pixelIcon([
    '##########',
    '#..#.....#',
    '#..#.....#',
    '#..#.....#',
    '#..#.....#',
    '#..#.....#',
    '#..#.....#',
    '#..#.....#',
    '#..#.....#',
    '##########',
  ]),
  feed: pixelIcon([
    '##########',
    '#........#',
    '#........#',
    '#........#',
    '##########',
    '#.##.###.#',
    '#........#',
    '#.##.##..#',
    '#........#',
    '##########',
  ]),
  settings: pixelIcon([
    '....##....',
    '.#.####.#.',
    '..######..',
    '.###..###.',
    '####..####',
    '####..####',
    '.###..###.',
    '..######..',
    '.#.####.#.',
    '....##....',
  ]),
  help: pixelIcon([
    '..######..',
    '.##....##.',
    '.##....##.',
    '......##..',
    '.....##...',
    '....##....',
    '....##....',
    '..........',
    '....##....',
    '....##....',
  ]),
  maximize: pixelIcon([
    '..........',
    '.####.....',
    '.##.......',
    '.#.#......',
    '.#........',
    '........#.',
    '......#.#.',
    '.......##.',
    '.....####.',
    '..........',
  ]),
  restore: pixelIcon([
    '..........',
    '...#......',
    '...#......',
    '.###......',
    '..........',
    '..........',
    '......###.',
    '......#...',
    '......#...',
    '..........',
  ]),
  pencil: pixelIcon([
    '.......##.',
    '......#..#',
    '.....#..#.',
    '....#..#..',
    '...#..#...',
    '..#..#....',
    '.#..#.....',
    '.#.#......',
    '.##.......',
    '..........',
  ]),
  close: pixelIcon([
    '..........',
    '.##....##.',
    '.###..###.',
    '..######..',
    '...####...',
    '...####...',
    '..######..',
    '.###..###.',
    '.##....##.',
    '..........',
  ]),
  search: pixelIcon([
    '.####.....',
    '#....#....',
    '#....#....',
    '#....#....',
    '#....#....',
    '.####.....',
    '.....##...',
    '......##..',
    '.......##.',
    '........#.',
  ]),
  copy: pixelIcon([
    '...#######',
    '...#.....#',
    '...#.....#',
    '#######..#',
    '#.....#..#',
    '#.....#..#',
    '#.....####',
    '#.....#...',
    '#.....#...',
    '#######...',
  ]),
  check: pixelIcon([
    '..........',
    '.........#',
    '........##',
    '.......##.',
    '#.....##..',
    '##...##...',
    '.##.##....',
    '..###.....',
    '...#......',
    '..........',
  ]),
  follow: pixelIcon([
    '....##....',
    '....##....',
    '..######..',
    '.#......#.',
    '##..##..##',
    '##..##..##',
    '.#......#.',
    '..######..',
    '....##....',
    '....##....',
  ]),
  center: pixelIcon([
    '###....###',
    '#........#',
    '#........#',
    '....##....',
    '...####...',
    '...####...',
    '....##....',
    '#........#',
    '#........#',
    '###....###',
  ]),
  hand: pixelIcon([
    '...#.#....',
    '..#.#.#...',
    '..#.#.#.#.',
    '..#.#.#.#.',
    '..#######.',
    '#.#######.',
    '##.######.',
    '.########.',
    '..######..',
    '...####...',
  ]),
  warn: pixelIcon([
    '....##....',
    '...####...',
    '...#..#...',
    '..##..##..',
    '..##..##..',
    '.###..###.',
    '.########.',
    '####..####',
    '##########',
    '..........',
  ]),
  clock: pixelIcon([
    '..######..',
    '.#......#.',
    '#....#...#',
    '#....#...#',
    '#....###.#',
    '#........#',
    '#........#',
    '.#......#.',
    '..######..',
    '..........',
  ]),
  // Ampulheta (esperando o shell): moldura na cor do texto e areia âmbar caindo.
  hourglass: pixelIcon(
    [
      '#########',
      '.#sssss#.',
      '.#sssss#.',
      '..#sss#..',
      '...#s#...',
      '...#s#...',
      '..#.s.#..',
      '.#..s..#.',
      '.#.sss.#.',
      '#########',
    ],
    { '#': 'currentColor', s: '#f7c76b' },
  ),
  // Janela de terminal com o prompt ">_".
  terminal: pixelIcon([
    '##########',
    '#........#',
    '#.#......#',
    '#..#.....#',
    '#...#....#',
    '#..#.....#',
    '#.#..###.#',
    '#........#',
    '##########',
  ]),
  /** Pessoa com um +: novo agente (o + sozinho já é o "aproximar" da câmera). */
  newAgent: pixelIcon(['..##......', '.####.....', '.####...#.', '..##...###', '........#.', '.####.....', '######....', '######....']),
  delivery: pixelIcon(['...####...', '..#....#..', '.#......#.', '##########', '#....#...#', '#...###..#', '#....#...#', '#........#', '##########']),
  chevronLeft: pixelIcon(['....##', '...##.', '..##..', '.##...', '..##..', '...##.', '....##']),
  chevronRight: pixelIcon(['##....', '.##...', '..##..', '...##.', '..##..', '.##...', '##....']),
  mic: pixelIcon(['...##...', '..####..', '..####..', '..####..', '#.####.#', '#..##..#', '.#....#.', '..####..', '...##...', '..####..']),
  stopRec: pixelIcon(['........', '.######.', '.######.', '.######.', '.######.', '.######.', '.######.', '........']),
  attach: pixelIcon(['...###..', '..#...#.', '..#.#.#.', '..#.#.#.', '..#.#.#.', '..#.#.#.', '..#...#.', '...###..']),
  lock: pixelIcon(['..####..', '.##..##.', '.#....#.', '.#....#.', '########', '###..###', '###..###', '########', '########']),
  chevronDown: pixelIcon(['#......#', '##....##', '.##..##.', '..####..', '...##...']),
  chevronUp: pixelIcon(['...##...', '..####..', '.##..##.', '##....##', '#......#']),
  arrowDown: pixelIcon(['...##...', '...##...', '...##...', '#######.', '.#####..', '..###...', '...#....'].map((r) => r.padEnd(8, '.'))),
  sun: pixelIcon([
    '....##....',
    '.#..##..#.',
    '..######..',
    '..######..',
    '##########',
    '##########',
    '..######..',
    '..######..',
    '.#..##..#.',
    '....##....',
  ]),
  moon: pixelIcon([
    '....####..',
    '..######..',
    '.#####....',
    '.####.....',
    '.####.....',
    '.####.....',
    '.####.....',
    '.#####....',
    '..######..',
    '....####..',
  ]),
  volume: pixelIcon([
    '....##....',
    '..####..#.',
    '######.##.',
    '######.##.',
    '######.##.',
    '######.##.',
    '..####..#.',
    '....##....',
  ]),
  volumeMute: pixelIcon([
    '....##....',
    '..####.#.#',
    '######..#.',
    '######.#.#',
    '######.#.#',
    '######..#.',
    '..####.#.#',
    '....##....',
  ]),
} as const;

export type IconKey = keyof typeof ICONS;

/** Marca do Habblaud em pixels (usada quando /assets/brand/logo-mark.png não existe): prédio com janelas acesas. */
export const FALLBACK_MARK = pixelIcon(
  [
    '.....######.....',
    '.....#rrrr#.....',
    '..############..',
    '..#llllllllll#..',
    '..#lwwlwwlbbl#..',
    '..#lwwlwwlbbl#..',
    '..#llllllllll#..',
    '..#lbblwwlwwl#..',
    '..#lbblwwlwwl#..',
    '..#llllllllll#..',
    '..#lwwlddlbbl#..',
    '..#lwwlddlbbl#..',
    '..#llllddllll#..',
    '################',
  ],
  { '#': '#2b3550', l: '#dfe6f2', r: '#ff8a5b', w: '#ffd36b', b: '#7cc8ff', d: '#3a4566' },
  'ui-px-icon ui-mark',
);

/**
 * Logotipo "Habblaud" em pixels, com a mesma fonte bitmap da placa da marca (assets/brand/signage.png, gerada por
 * scripts/assets/pixelart.py): a Pixelify Sans não fica nítida nesse tamanho.
 * c = "Hab" (creme), t = "blaud" (âmbar), s = sombra de 1 px.
 */
export const WORDMARK_ROWS = [
  'c...c.......c.....t.....tt..................t',
  'c...c.......c.....t.....st..................t',
  'c...c..ccc..cccc..tttt...t...ttt..t...t..tttt',
  'ccccc..sssc.csssc.tssst..t...ssst.t...t.tssst',
  'csssc..cccc.c...c.t...t..t...tttt.t...t.t...t',
  'c...c.csssc.c...c.t...t..t..tssst.t...t.t...t',
  'c...c.scccc.ccccs.tttts.ttt.stttt.stttt.stttt',
  's...s..ssss.ssss..ssss..sss..ssss..ssss..ssss',
] as const;

export const WORDMARK = pixelIcon(WORDMARK_ROWS, { s: 'rgba(6, 8, 14, 0.62)', c: '#f4f1ea', t: '#fac665' }, 'ui-wordmark');

/**
 * Logotipos oficiais dos provedores de IA (OpenAI, Antigravity e Claude).
 */
export const OPENAI_PATH_D =
  'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

export const ANTIGRAVITY_PATH_D =
  'M144.248 149.062c7.5 5.626 18.75 1.876 8.437-8.437-30.937-30-24.375-112.5-62.812-112.5-38.438 0-31.875 82.5-62.813 112.5-11.25 11.25.938 14.063 8.438 8.437 29.062-19.687 27.187-54.375 54.375-54.375 27.187 0 25.312 34.688 54.375 54.375Z';

export const CLAUDE_PATH_D =
  'm3.127 10.604 3.135-1.76.053-.153-.053-.085H6.11l-.525-.032-1.791-.048-1.554-.065-1.505-.08-.38-.081L0 7.832l.036-.234.32-.214.455.04 1.009.069 1.513.105 1.097.064 1.626.17h.259l.036-.105-.089-.065-.068-.064-1.566-1.062-1.695-1.121-.887-.646-.48-.327-.243-.306-.104-.67.435-.48.585.04.15.04.593.456 1.267.981 1.654 1.218.242.202.097-.068.012-.049-.109-.181-.9-1.626-.96-1.655-.428-.686-.113-.411a2 2 0 0 1-.068-.484l.496-.674L4.446 0l.662.089.279.242.411.94.666 1.48 1.033 2.014.302.597.162.553.06.17h.105v-.097l.085-1.134.157-1.392.154-1.792.052-.504.25-.605.497-.327.387.186.319.456-.045.294-.19 1.23-.37 1.93-.243 1.29h.142l.161-.16.654-.868 1.097-1.372.484-.545.565-.601.363-.287h.686l.505.751-.226.775-.707.895-.585.759-.839 1.13-.524.904.048.072.125-.012 1.897-.403 1.024-.186 1.223-.21.553.258.06.263-.218.536-1.307.323-1.533.307-2.284.54-.028.02.032.04 1.029.098.44.024h1.077l2.005.15.525.346.315.424-.053.323-.807.411-3.631-.863-.872-.218h-.12v.073l.726.71 1.331 1.202 1.667 1.55.084.383-.214.302-.226-.032-1.464-1.101-.565-.497-1.28-1.077h-.084v.113l.295.432 1.557 2.34.08.718-.112.234-.404.141-.444-.08-.911-1.28-.94-1.44-.759-1.291-.093.053-.448 4.821-.21.246-.484.186-.403-.307-.214-.496.214-.98.258-1.28.21-1.016.19-1.263.112-.42-.008-.028-.092.012-.953 1.307-1.448 1.957-1.146 1.227-.274.109-.477-.247.045-.44.266-.39 1.586-2.018.956-1.25.617-.723-.004-.105h-.036l-4.212 2.736-.75.096-.324-.302.04-.496.154-.162 1.267-.871z';

export const OPENAI_LOGO_SVG = `<svg class="ui-provider-logo" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path fill="currentColor" d="${OPENAI_PATH_D}"/></svg>`;

export const ANTIGRAVITY_LOGO_SVG = `<svg class="ui-provider-logo" viewBox="0 0 180 180" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="agy-grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#4285F4"/><stop offset="33%" stop-color="#34A853"/><stop offset="67%" stop-color="#FBBC05"/><stop offset="100%" stop-color="#EA4335"/></linearGradient></defs><path fill="url(#agy-grad)" style="fill:url(#agy-grad)!important" d="${ANTIGRAVITY_PATH_D}"/></svg>`;

export const CLAUDE_LOGO_SVG = `<svg class="ui-provider-logo" viewBox="0 0 16 16" width="100%" height="100%" fill="currentColor" aria-hidden="true"><path fill="currentColor" d="${CLAUDE_PATH_D}"/></svg>`;

export const PROVIDER_LOGOS: Record<Provider, string> = {
  codex: OPENAI_LOGO_SVG,
  antigravity: ANTIGRAVITY_LOGO_SVG,
  claude: CLAUDE_LOGO_SVG,
};

let openaiPath2D: Path2D | null = null;
let antigravityPath2D: Path2D | null = null;
let claudePath2D: Path2D | null = null;

function getProviderPath(p: Provider): { path: Path2D; w: number; h: number; cx: number; cy: number } | null {
  if (typeof Path2D === 'undefined') return null;
  if (p === 'codex') {
    if (!openaiPath2D) openaiPath2D = new Path2D(OPENAI_PATH_D);
    return { path: openaiPath2D, w: 24, h: 24, cx: 12, cy: 12 };
  }
  if (p === 'antigravity') {
    if (!antigravityPath2D) antigravityPath2D = new Path2D(ANTIGRAVITY_PATH_D);
    return { path: antigravityPath2D, w: 180, h: 180, cx: 90, cy: 90 };
  }
  if (p === 'claude') {
    if (!claudePath2D) claudePath2D = new Path2D(CLAUDE_PATH_D);
    return { path: claudePath2D, w: 16, h: 16, cx: 8, cy: 8 };
  }
  return null;
}

export function drawProviderIcon(
  ctx: CanvasRenderingContext2D,
  provider: Provider,
  x: number,
  y: number,
  size: number,
  color?: string,
): boolean {
  const p = getProviderPath(provider);
  if (!p) return false;
  ctx.save();
  if (provider === 'antigravity' && (!color || color === 'gradient')) {
    const r = size / 2;
    const grad = ctx.createLinearGradient(x - r, y, x + r, y);
    grad.addColorStop(0, '#4285F4');
    grad.addColorStop(0.33, '#34A853');
    grad.addColorStop(0.67, '#FBBC05');
    grad.addColorStop(1, '#EA4335');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = color ?? '#ffffff';
  }
  ctx.translate(x, y);
  const scale = size / Math.max(p.w, p.h);
  ctx.scale(scale, scale);
  ctx.translate(-p.cx, -p.cy);
  ctx.fill(p.path);
  ctx.restore();
  return true;
}

