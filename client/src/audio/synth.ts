// Sons sintetizados com WebAudio — v2: vozes ricas sem arquivos de áudio.
import type { SoundKind } from './scheduler';

export interface VoiceOpts {
  /** Ganho final (já com o volume mestre). */
  gain: number;
  /** -1 .. 1 (esquerda .. direita). */
  pan?: number;
  /** Teclado: teclas na rajada. */
  count?: number;
  rng: () => number;
  /** Buffers de ruído. */
  noise: NoiseBuffers | null;
}

export interface NoiseBuffers {
  hard: AudioBuffer;    // gõ phím cứng, click
  soft: AudioBuffer;    // thảm, sons suaves
  carpet: AudioBuffer;  // passos em thảm
}

/** Envelope percussivo: ataque curto e queda exponencial. */
function env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone(
  ac: AudioContext, out: AudioNode, type: OscillatorType,
  freq: number, t: number, peak: number, attack: number, decay: number,
  toFreq?: number,
): void {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (toFreq !== undefined) {
    o.frequency.exponentialRampToValueAtTime(Math.max(1, toFreq), t + Math.min(decay * 0.6, 0.12));
  }
  env(g, t, peak, attack, decay);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

function burst(
  ac: AudioContext, out: AudioNode, buf: AudioBuffer,
  t: number, peak: number, attack: number, decay: number,
  lpFreq: number, hpFreq = 0,
): void {
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  env(g, t, peak, attack, decay);
  src.connect(g);
  let node: AudioNode = g;
  if (hpFreq > 0) {
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = hpFreq;
    g.connect(hp);
    node = hp;
  }
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = lpFreq;
  node.connect(lp).connect(out);
  src.start(t, 0, Math.min(buf.duration, attack + decay + 0.05));
}

/** Cria os 3 buffers de ruído necessários para as vozes. */
export function makeNoise(ac: AudioContext): NoiseBuffers | null {
  try {
    const make = (dur: number): AudioBuffer => {
      const len = Math.floor(ac.sampleRate * dur);
      const b = ac.createBuffer(1, len, ac.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return b;
    };
    return { hard: make(0.08), soft: make(0.14), carpet: make(0.20) };
  } catch {
    return null;
  }
}

/** Toca `kind` em `t` (tempo do AudioContext) na saída `dest`. */
export function playVoice(
  ac: AudioContext, dest: AudioNode, kind: SoundKind, t: number, o: VoiceOpts,
): void {
  let out: AudioNode = dest;
  if (o.pan !== undefined && o.pan !== 0 && typeof ac.createStereoPanner === 'function') {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, o.pan));
    p.connect(dest);
    out = p;
  }
  const g = o.gain;
  switch (kind) {
    case 'chime':        chime(ac, out, t, g);            return;
    case 'pop':          pop(ac, out, t, g);              return;
    case 'elevator':     elevator(ac, out, t, g);         return;
    case 'keys':         keysVoice(ac, out, t, o);        return;
    case 'pingpong':     tone(ac, out, 'sine', 1320, t, 0.10 * g, 0.001, 0.07, 860); return;
    case 'table':        tone(ac, out, 'sine', 780, t, 0.07 * g, 0.001, 0.045, 530); return;
    case 'arcade':       arcade(ac, out, t, g, o.rng);    return;
    case 'footstep':     footstepVoice(ac, out, t, g, o); return;
    case 'chair':        chairVoice(ac, out, t, g, o);    return;
    case 'coffee':       coffeeVoice(ac, out, t, g, o);   return;
    case 'notification': notificationVoice(ac, out, t, g); return;
  }
}

// ─── Vozes ───────────────────────────────────────────────────────────────────

/** Sino inarmônico: 4 parciais de bronze + segundo ping 170 ms depois. */
function chime(ac: AudioContext, out: AudioNode, t: number, g: number): void {
  const partials: [number, number, number][] = [
    [1.000, 0.22, 2.2],
    [2.756, 0.11, 1.4],
    [5.404, 0.055, 0.85],
    [8.933, 0.025, 0.45],
  ];
  const base = 740;
  for (const [r, rel, dec] of partials) {
    tone(ac, out, 'sine', base * r, t, rel * g, 0.003, dec);
  }
  const base2 = 880;
  for (const [r, rel, dec] of partials) {
    tone(ac, out, 'sine', base2 * r, t + 0.18, rel * 0.75 * g, 0.003, dec * 0.8);
  }
}

/** Pop elástico: sobe depois desce — feedback positivo. */
function pop(ac: AudioContext, out: AudioNode, t: number, g: number): void {
  tone(ac, out, 'sine', 1600, t, 0.04 * g, 0.001, 0.008);
  tone(ac, out, 'sine', 340, t + 0.004, 0.16 * g, 0.006, 0.09, 560);
  tone(ac, out, 'sine', 680, t + 0.004, 0.07 * g, 0.006, 0.07, 340);
}

/** Ding de elevador: dois pings inarmônicos separados 170 ms. */
function elevator(ac: AudioContext, out: AudioNode, t: number, g: number): void {
  const ding = (at: number): void => {
    tone(ac, out, 'sine', 880, at, 0.13 * g, 0.003, 1.6);
    tone(ac, out, 'sine', 880 * 3.27, at, 0.055 * g, 0.003, 0.9);
    tone(ac, out, 'sine', 880 * 5.40, at, 0.022 * g, 0.003, 0.45);
  };
  ding(t);
  ding(t + 0.17);
}

/** Teclado mecânico: 3 tipos de tecla sorteados com timing humano. */
function keysVoice(ac: AudioContext, out: AudioNode, t: number, o: VoiceOpts): void {
  const nb = o.noise;
  if (!nb) return;
  const n = Math.max(1, Math.min(9, o.count ?? 4));
  let at = t;
  for (let i = 0; i < n; i++) {
    const vel = 0.6 + o.rng() * 0.4;
    const r = o.rng();
    const isSpace = i > 0 && o.rng() < 0.08;
    if (isSpace) {
      burst(ac, out, nb.soft, at, 0.11 * o.gain * vel, 0.001, 0.05, 600, 60);
      tone(ac, out, 'sine', 180, at, 0.04 * o.gain * vel, 0.001, 0.04);
    } else if (r < 0.55) {
      const fc = 1800 + o.rng() * 1400;
      const src = ac.createBufferSource();
      src.buffer = nb.hard;
      const bp = ac.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = 1.2;
      const gn = ac.createGain();
      env(gn, at, 0.09 * o.gain * vel, 0.0012, 0.018 + o.rng() * 0.010);
      src.connect(bp).connect(gn).connect(out);
      src.start(at, o.rng() * 0.01, 0.04);
    } else {
      burst(ac, out, nb.soft, at, 0.055 * o.gain * vel, 0.001, 0.014, 2800, 800);
    }
    at += 0.055 + o.rng() * 0.075 + (o.rng() < 0.12 ? 0.14 : 0);
  }
}

/** Fliperama: arpejo em onda quadrada filtrada. */
function arcade(ac: AudioContext, out: AudioNode, t: number, g: number, rng: () => number): void {
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.8;
  lp.connect(out);
  const scale = [1046.5, 1318.5, 1568, 1760, 2093];
  for (let i = 0; i < 3; i++) {
    const f = scale[Math.floor(rng() * scale.length)];
    tone(ac, lp, 'square', f, t + i * 0.06, 0.032 * g, 0.002, 0.055);
  }
}

/** Passo: impacto + click de superfície (madeira ou thảm). */
function footstepVoice(ac: AudioContext, out: AudioNode, t: number, g: number, o: VoiceOpts): void {
  const nb = o.noise;
  if (!nb) return;
  const vel = 0.7 + o.rng() * 0.3;
  tone(ac, out, 'sine', 85 + o.rng() * 25, t, 0.09 * g * vel, 0.002, 0.09);
  if (o.rng() < 0.3) {
    burst(ac, out, nb.carpet, t, 0.04 * g * vel, 0.001, 0.05, 900, 120);
  } else {
    burst(ac, out, nb.hard, t, 0.06 * g * vel, 0.001, 0.022, 2200, 250);
    tone(ac, out, 'sine', 320 + o.rng() * 80, t + 0.003, 0.025 * g * vel, 0.001, 0.06);
  }
}

/** Cadeira de escritório: squeak + whoosh ao sentar/levantar. */
function chairVoice(ac: AudioContext, out: AudioNode, t: number, g: number, o: VoiceOpts): void {
  const nb = o.noise;
  if (!nb) return;
  tone(ac, out, 'sine', 680 + o.rng() * 180, t, 0.035 * g, 0.004, 0.08, 520);
  burst(ac, out, nb.soft, t + 0.01, 0.04 * g, 0.008, 0.07, 1200, 180);
  tone(ac, out, 'triangle', 240, t + 0.04, 0.02 * g, 0.002, 0.045);
}

/** Cafeteira: fluxo de água + hiss de vapor. */
function coffeeVoice(ac: AudioContext, out: AudioNode, t: number, g: number, o: VoiceOpts): void {
  const nb = o.noise;
  if (!nb) return;
  burst(ac, out, nb.soft, t, 0.06 * g, 0.12, 0.55, 800, 200);
  if (o.rng() < 0.55) {
    burst(ac, out, nb.hard, t + 0.15 + o.rng() * 0.3, 0.022 * g, 0.02, 0.12, 3500, 900);
  }
}

/** Click suave para feedback de UI. */
function notificationVoice(ac: AudioContext, out: AudioNode, t: number, g: number): void {
  tone(ac, out, 'sine', 1200, t, 0.04 * g, 0.002, 0.025, 900);
}
