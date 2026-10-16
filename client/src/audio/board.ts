// Mesa de som v2: AudioContext único + compressor + reverb send + ganhos por categoria.
import { makeRoomIR } from './reverb';
import { SoundScheduler, type SoundKind, type SoundSettings } from './scheduler';
import { makeNoise, playVoice, type NoiseBuffers } from './synth';
import { LoungeBGM } from './bgm';

// Kinds que se beneficiam do reverb (sons com sustain longo)
const REVERB_KINDS = new Set<SoundKind>(['chime', 'elevator']);

export class SoundBoard {
  readonly scheduler = new SoundScheduler();
  private ac: AudioContext | null = null;
  private dry: AudioNode | null = null;
  private reverbSend: GainNode | null = null;
  private noise: NoiseBuffers | null = null;
  private bgm: LoungeBGM | null = null;
  private enabled = false;

  configure(enabled: boolean, settings: SoundSettings): void {
    this.enabled = enabled;
    this.scheduler.configure(enabled, settings);
    if (!enabled) this.bgm?.setTargetGain(0);
  }

  unlock(): Promise<void> {
    if (!this.enabled) return Promise.resolve();
    try {
      if (!this.ac) {
        const Ctor = window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return Promise.resolve();
        const ac = new Ctor();

        // Compressor (saída seca → master boost → destination)
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 10;
        comp.ratio.value = 4;
        comp.attack.value = 0.003;
        comp.release.value = 0.12;

        const masterBoost = ac.createGain();
        masterBoost.gain.value = 1.6;
        comp.connect(masterBoost);
        masterBoost.connect(ac.destination);
        this.dry = comp;

        // Reverb send (20% wet)
        const reverbSend = ac.createGain();
        reverbSend.gain.value = 0.20;
        const convolver = ac.createConvolver();
        convolver.buffer = makeRoomIR(ac);
        const reverbOut = ac.createGain();
        reverbOut.gain.value = 0.85;
        reverbSend.connect(convolver).connect(reverbOut).connect(masterBoost);
        this.reverbSend = reverbSend;

        // BGM do lounge
        this.bgm = new LoungeBGM(ac, comp);

        this.ac = ac;
        this.noise = makeNoise(ac);
      }
      if (this.ac.state === 'suspended') return this.ac.resume().catch(() => undefined);
    } catch {
      this.ac = null;
      this.dry = null;
      this.reverbSend = null;
    }
    return Promise.resolve();
  }

  /** Toca `kind` se a preferência e os limites deixarem. Devolve se tocou. */
  play(kind: SoundKind, opts: { gain?: number; pan?: number; count?: number } = {}): boolean {
    const ac = this.ac;
    if (!ac || !this.dry || ac.state !== 'running') return false;
    const hidden = typeof document !== 'undefined' && document.hidden;
    const gain = this.scheduler.decide(kind, performance.now(), { hidden, gain: opts.gain });
    if (gain === null) return false;
    try {
      const dest = REVERB_KINDS.has(kind) && this.reverbSend ? this.reverbSend : this.dry;
      playVoice(ac, dest, kind, ac.currentTime + 0.01, {
        gain,
        pan: opts.pan,
        count: opts.count,
        rng: Math.random,
        noise: this.noise,
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Define o volume do BGM do lounge (0–1). Chamado quando há/não há gatherings. */
  setLoungeBGM(gain: number): void {
    this.bgm?.setTargetGain(this.enabled ? gain : 0);
  }
}
