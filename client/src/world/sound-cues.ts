// Sons do ambiente sugeridos pelo mundo: teclado de quem trabalha à vista, "ding" quando a porta de
// um elevador abre (alguém chega ou sai) e as rodas (raquetadas do pingue-pongue, fliperama). Só
// observa a simulação e a câmera; quem decide se toca (preferência, volume, aba oculta) é a UI.
import type { SoundCue } from './api';
import type { Camera } from './camera';
import type { Character } from './sim/character';
import type { Sim } from './sim/sim';

/** Reavalia quem está digitando a cada isto (ms). */
const KEYS_TICK_MS = 160;
/** Período (ms) de uma ida da bolinha do pingue-pongue (o mesmo do desenho). */
const PINGPONG_PERIOD = 1_100;

interface ViewRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export class SoundCues {
  private doors: number[] = [];
  private keysAt = 0;
  private nextKeysAt = 0;
  private nextArcadeAt = 0;
  private rally = new Map<number, number>();
  private stepPhases = new Map<string, number>();
  private seatedState = new Map<string, boolean>();
  private coffeeHeld = new Map<string, string>();
  private nextCoffeeAt = 0;
  private loungeGainEmitter: ((gain: number) => void) | null = null;

  constructor(
    private readonly sim: Sim,
    private readonly camera: Camera,
    private readonly rng: () => number = Math.random,
    onLoungeBGM?: (gain: number) => void,
  ) {
    this.loungeGainEmitter = onLoungeBGM ?? null;
  }

  update(now: number, emit: (cue: SoundCue) => void): void {
    const a = this.camera.screenToWorld(0, 0);
    const b = this.camera.screenToWorld(this.camera.viewW, this.camera.viewH);
    const view = { x0: a.x, y0: a.y, x1: b.x, y1: b.y };
    // de longe (zoom baixo) tudo fica mais baixinho
    const near = Math.max(0.45, Math.min(1, 0.25 + this.camera.zoom * 0.25));
    this.elevators(view, emit);
    this.keys(now, view, near, emit);
    this.social(now, view, near, emit);
    this.footsteps(now, view, near, emit);
    this.chairs(view, near, emit);
    this.coffee(now, view, emit);
  }

  private pan(x: number, v: ViewRect): number {
    const half = Math.max(1, (v.x1 - v.x0) / 2);
    return Math.max(-0.7, Math.min(0.7, ((x - (v.x0 + v.x1) / 2) / half) * 0.7));
  }

  private inView(x: number, y: number, v: ViewRect, m = 16): boolean {
    return x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m;
  }

  /** "Ding" quando a porta começa a abrir; fora da tela, mais baixo (ainda avisa que alguém chegou). */
  private elevators(view: ViewRect, emit: (cue: SoundCue) => void): void {
    this.sim.elevators.forEach((e, i) => {
      const prev = this.doors[i];
      this.doors[i] = e.door;
      if (prev === undefined || prev > 0.01 || e.door <= 0.01) return;
      const spot = this.sim.spots.get(e.spotId);
      if (!spot) return;
      emit({ kind: 'elevator', gain: this.inView(spot.x, spot.y, view, 24) ? 1 : 0.5, pan: this.pan(spot.x, view) });
    });
  }

  /** Rajadas de teclas, mais frequentes quanto mais gente digita na tela. */
  private keys(now: number, view: ViewRect, near: number, emit: (cue: SoundCue) => void): void {
    if (now - this.keysAt < KEYS_TICK_MS) return;
    this.keysAt = now;
    let n = 0;
    let sx = 0;
    for (const ch of this.sim.chars.values()) {
      if (!typing(ch) || !this.inView(ch.x, ch.y, view)) continue;
      n++;
      sx += ch.x;
    }
    if (!n || now < this.nextKeysAt) return;
    if (this.rng() > Math.min(0.8, 0.3 + 0.12 * n)) return;
    this.nextKeysAt = now + (700 + this.rng() * 1500) / Math.sqrt(Math.min(n, 6));
    emit({ kind: 'keys', gain: near * Math.min(1, 0.6 + 0.1 * n), pan: this.pan(sx / n, view), count: 2 + Math.floor(this.rng() * 5) });
  }

  /** Pingue-pongue (raquetadas e quiques no ritmo da bolinha desenhada) e o fliperama. */
  private social(now: number, view: ViewRect, near: number, emit: (cue: SoundCue) => void): void {
    const alive = new Set<number>();
    for (const g of this.sim.social.gatherings) {
      if (g.phase !== 'run') continue;
      if (g.kind !== 'pingpong' && g.kind !== 'arcade') continue;
      let x = 0;
      let y = 0;
      let k = 0;
      for (const m of g.members) {
        if (m.role !== 'player' || m.left) continue;
        const ch = this.sim.chars.get(m.id);
        if (!ch) continue;
        x += ch.x;
        y += ch.y;
        k++;
      }
      if (!k) continue;
      x /= k;
      y /= k;
      if (!this.inView(x, y, view, 24)) continue;
      if (g.kind === 'pingpong') {
        alive.add(g.id);
        // a cada meia ida: raquetada (pontas) ou quique na mesa (meio), como no desenho
        const seg = Math.floor(((now - g.startAt) % (PINGPONG_PERIOD * 2)) / (PINGPONG_PERIOD / 2));
        const prev = this.rally.get(g.id);
        this.rally.set(g.id, seg);
        if (prev !== undefined && prev !== seg) emit({ kind: seg % 2 === 0 ? 'pingpong' : 'table', gain: near, pan: this.pan(x, view) });
      } else if (now >= this.nextArcadeAt) {
        this.nextArcadeAt = now + 500 + this.rng() * 900;
        emit({ kind: 'arcade', gain: near * 0.8, pan: this.pan(x, view) });
      }
    }
    for (const id of this.rally.keys()) if (!alive.has(id)) this.rally.delete(id);
    // BGM do lounge: ativo quando há gatherings na tela
    this.loungeGainEmitter?.(alive.size > 0 ? near : 0);
  }

  /** Passos: personagem andando na tela. */
  private footsteps(now: number, view: ViewRect, near: number, emit: (cue: SoundCue) => void): void {
    for (const ch of this.sim.chars.values()) {
      if (ch.pose !== 'walk' || ch.inside || ch.alpha < 0.6) continue;
      if (!this.inView(ch.x, ch.y, view, 8)) continue;
      const stepPhase = Math.floor(now / 280);
      const prev = this.stepPhases.get(ch.id);
      this.stepPhases.set(ch.id, stepPhase);
      if (prev === undefined || prev === stepPhase) continue;
      emit({ kind: 'footstep', gain: near * 0.65, pan: this.pan(ch.x, view) });
    }
    // Limpa personagens que saíram
    for (const id of this.stepPhases.keys()) {
      if (!this.sim.chars.has(id)) this.stepPhases.delete(id);
    }
  }

  /** Cadeira: detecta mudança de seated. */
  private chairs(view: ViewRect, near: number, emit: (cue: SoundCue) => void): void {
    for (const ch of this.sim.chars.values()) {
      if (ch.inside || ch.alpha < 0.6) continue;
      if (!this.inView(ch.x, ch.y, view, 8)) continue;
      const prev = this.seatedState.get(ch.id);
      const cur = ch.seated;
      this.seatedState.set(ch.id, cur);
      if (prev === undefined || prev === cur) continue;
      emit({ kind: 'chair', gain: near * 0.75, pan: this.pan(ch.x, view) });
    }
    for (const id of this.seatedState.keys()) {
      if (!this.sim.chars.has(id)) this.seatedState.delete(id);
    }
  }

  /** Cafeteira: emite quando personagem pega café/água. */
  private coffee(now: number, view: ViewRect, emit: (cue: SoundCue) => void): void {
    if (now < this.nextCoffeeAt) return;
    for (const ch of this.sim.chars.values()) {
      if (ch.held !== 'coffee' && ch.held !== 'water') continue;
      if (!this.inView(ch.x, ch.y, view, 12)) continue;
      if (ch.inside || ch.alpha < 0.6) continue;
      const prev = this.coffeeHeld.get(ch.id);
      const cur = ch.held;
      this.coffeeHeld.set(ch.id, cur);
      if (prev === cur || prev === undefined) continue; // só quando muda
      this.nextCoffeeAt = now + 4_000;
      emit({ kind: 'coffee', gain: 0.65, pan: this.pan(ch.x, view) });
      break;
    }
    for (const id of this.coffeeHeld.keys()) {
      if (!this.sim.chars.has(id)) this.coffeeHeld.delete(id);
    }
  }
}

/** Sentado na própria mesa, digitando. */
function typing(ch: Character): boolean {
  return ch.mode === 'work' && ch.seated && ch.pose === 'type' && !ch.leaving && !ch.inside && ch.alpha > 0.5;
}
