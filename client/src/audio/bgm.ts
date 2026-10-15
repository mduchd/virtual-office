// Música de fundo do lounge: lo-fi jazz algorítmico, sem arquivos de áudio.
// Loop de 4 acordes (Cmaj7 → Am7 → Fmaj7 → G7) a 78 BPM com swing suave.

export class LoungeBGM {
  private masterGain: GainNode;
  private playing = false;
  private nextBar = 0;
  private barCount = 0;
  private targetGain = 0;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private rafId = 0;

  private readonly BPM = 78;
  private readonly BEAT: number;
  private readonly BAR: number;

  /** 4 acordes: Cmaj7, Am7, Fmaj7, G7 — notas em Hz (4ª e 5ª oitava). */
  private readonly CHORDS: readonly (readonly number[])[] = [
    [523.25, 659.25, 783.99, 987.77], // Cmaj7 (5ª oitava)
    [440.00, 523.25, 659.25, 783.99], // Am7
    [349.23, 440.00, 523.25, 698.46], // Fmaj7
    [392.00, 493.88, 587.33, 783.99], // G7
  ];

  constructor(private readonly ac: AudioContext, dest: AudioNode) {
    this.BEAT = 60 / this.BPM;
    this.BAR = this.BEAT * 4;
    this.masterGain = ac.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(dest);
  }

  setTargetGain(g: number): void {
    this.targetGain = Math.max(0, Math.min(1, g));
    if (!this.playing && this.targetGain > 0) this.startLoop();
    else if (this.playing && this.targetGain === 0) this.stopLoop();
  }

  private startLoop(): void {
    this.playing = true;
    this.nextBar = this.ac.currentTime + 0.15;
    this.barCount = 0;
    this.scheduleAhead();
    this.animateFade();
  }

  private stopLoop(): void {
    this.playing = false;
    if (this.loopTimer !== null) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    cancelAnimationFrame(this.rafId);
    this.masterGain.gain.setTargetAtTime(0, this.ac.currentTime, 0.6);
  }

  /** Agenda compossos com look-ahead de 1.5 s para evitar glitches. */
  private scheduleAhead(): void {
    if (!this.playing) return;
    const lookahead = 1.8;
    while (this.nextBar < this.ac.currentTime + lookahead) {
      this.scheduleBar(this.nextBar, this.barCount % 4);
      this.nextBar += this.BAR;
      this.barCount++;
    }
    this.loopTimer = setTimeout(() => this.scheduleAhead(), 400);
  }

  private animateFade(): void {
    if (!this.playing && this.targetGain <= 0) return;
    const cur = this.masterGain.gain.value;
    const target = this.targetGain * 0.16; // max 16% do volume (discreto)
    const diff = target - cur;
    const next = cur + diff * 0.025;
    this.masterGain.gain.setValueAtTime(next, this.ac.currentTime);
    this.rafId = requestAnimationFrame(() => this.animateFade());
  }

  private scheduleBar(t: number, idx: number): void {
    const chord = this.CHORDS[idx];
    const b = this.BEAT;

    // Hi-hat em colcheias com swing leve
    for (let i = 0; i < 8; i++) {
      const swing = i % 2 === 1 ? b * 0.07 : 0;
      this.scheduleHihat(t + i * (b / 2) + swing, i % 4 === 0 ? 0.9 : 0.45);
    }
    // Baixo: beat 1 e 3 com varialção
    const bassFreq = chord[0] / 2; // uma oitava abaixo
    this.scheduleBass(t, bassFreq, 1.0);
    this.scheduleBass(t + b * 2.05, bassFreq * 1.5, 0.65);
    // Piano: beat 1 e 2.5 (compão sincopado)
    this.schedulePiano(t + b * 0.02, chord, 0.6);
    this.schedulePiano(t + b * 2.52, chord, 0.35);
  }

  private schedulePiano(t: number, freqs: readonly number[], gain: number): void {
    for (let i = 0; i < freqs.length; i++) {
      const det = 1 + (Math.random() - 0.5) * 0.004;
      const o = this.ac.createOscillator();
      const g = this.ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freqs[i] * det, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * 0.11, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + this.BEAT * 0.82);
      o.connect(g).connect(this.masterGain);
      o.start(t);
      o.stop(t + this.BEAT * 0.88);
    }
  }

  private scheduleBass(t: number, freq: number, gain: number): void {
    const o = this.ac.createOscillator();
    const g = this.ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * 0.13, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + this.BEAT * 0.55);
    o.connect(g).connect(this.masterGain);
    o.start(t);
    o.stop(t + this.BEAT * 0.62);
  }

  private scheduleHihat(t: number, gain: number): void {
    const dur = 0.022;
    const len = Math.floor(this.ac.sampleRate * dur);
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ac.createBufferSource();
    src.buffer = buf;
    const hp = this.ac.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7500;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(gain * 0.038, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(hp).connect(g).connect(this.masterGain);
    src.start(t);
  }
}
