// Ordem dos agentes de cada projeto escolhida pelo usuário (arrastando as linhas da lista lateral): uma ordem só por
// projeto, guardada no navegador pela sessão do Claude Code (não pelo processo, que muda ao retomar uma sessão).
const ORDER_KEY = 'habblaud.tabs.order';
/** Projetos lembrados (os mais recentes). */
const MAX_ROOMS = 50;

type OrderMap = Record<string, string[]>;

/**
 * Ordem dos agentes:
 * 1. Các agent đang chạy (tier 0: waiting, tier 1: working/shell) luôn được ưu tiên đẩy lên đầu danh sách.
 * 2. Trong cùng một tier: ưu tiên theo thứ tự kéo thả đã lưu trong trình duyệt.
 * 3. Nếu chưa kéo thả: agent nào mới hoạt động gần đây hơn (activeTime) sẽ lên trước.
 * 4. Mặc định giữ thứ tự ban đầu (arrival / index).
 */
export function orderAgents<T>(
  roomId: string,
  items: readonly T[],
  sessionOf: (item: T) => string,
  tierOf?: (item: T) => number,
  activeTimeOf?: (item: T) => number,
): T[] {
  const saved = loadOrder()[roomId];
  const rank = saved?.length ? new Map(saved.map((sid, i) => [sid, i])) : null;
  return items
    .map((item, i) => ({
      item,
      i,
      tier: tierOf ? tierOf(item) : 0,
      time: activeTimeOf ? activeTimeOf(item) : 0,
      r: rank ? rank.get(sessionOf(item)) : undefined,
    }))
    .sort((x, y) => {
      if (x.tier !== y.tier) return x.tier - y.tier;
      if (x.r !== undefined && y.r !== undefined) return x.r - y.r;
      if (x.r !== undefined) return -1;
      if (y.r !== undefined) return 1;
      if (x.tier <= 1 && x.time !== y.time) return y.time - x.time;
      return x.i - y.i;
    })
    .map((x) => x.item);
}

/** Põe `from` antes (ou depois) de `to` em `items` (já na ordem mostrada) e guarda a ordem do projeto. */
export function moveAgent<T>(roomId: string, items: readonly T[], idOf: (item: T) => string, sessionOf: (item: T) => string, from: string, to: string, after: boolean): boolean {
  const moved = items.find((a) => idOf(a) === from);
  const rest = items.filter((a) => idOf(a) !== from);
  const at = rest.findIndex((a) => idOf(a) === to);
  if (!moved || at < 0) return false;
  rest.splice(after ? at + 1 : at, 0, moved);
  saveOrder(roomId, rest.map(sessionOf));
  return true;
}

function loadOrder(): OrderMap {
  try {
    const v = JSON.parse(localStorage.getItem(ORDER_KEY) ?? '{}') as unknown;
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    // Só listas de sessões: um valor de outro formato (editado à mão, outra versão) não pode quebrar a lista lateral.
    const map: OrderMap = {};
    for (const [room, ids] of Object.entries(v)) {
      if (Array.isArray(ids)) map[room] = ids.filter((x): x is string => typeof x === 'string');
    }
    return map;
  } catch {
    return {};
  }
}

function saveOrder(roomId: string, sessions: string[]): void {
  try {
    const map = loadOrder();
    delete map[roomId];
    map[roomId] = sessions;
    const keys = Object.keys(map);
    for (const k of keys.slice(0, Math.max(0, keys.length - MAX_ROOMS))) delete map[k];
    localStorage.setItem(ORDER_KEY, JSON.stringify(map));
  } catch {
    // sem armazenamento: a ordem vale só até recarregar
  }
}
