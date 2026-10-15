// Resposta ao impulso (IR) sintética para reverb de sala — sem arquivos de áudio.
// Usa decaimento de ruído com moldagem espectral (treble morre mais rápido).

/** Cria um AudioBuffer de IR para sala de escritório (rt60 ≈ 0.75 s). */
export function makeRoomIR(ac: AudioContext, rt60 = 0.75): AudioBuffer {
  const len = Math.floor(ac.sampleRate * (rt60 + 0.06));
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  const sr = ac.sampleRate;
  const predelay = Math.floor(sr * 0.012); // 12 ms de pré-delay

  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    const lpCoef = ch === 0 ? 0.80 : 0.78; // leve diferença L/R para width
    for (let i = predelay; i < len; i++) {
      const t = (i - predelay) / sr;
      const env = Math.exp(-t * (Math.log(1000) / rt60));
      const raw = (Math.random() * 2 - 1) * env;
      lp = lp * lpCoef + raw * (1 - lpCoef);
      d[i] = lp;
    }
  }
  return buf;
}
