/** Tiny WebAudio sound effects (no assets). Subtle by design. */
let ctx: AudioContext | null = null;

function ac() {
  if (typeof window === 'undefined') return null;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.05, type: OscillatorType = 'sine') {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.02);
}

export type SoundName = 'correct' | 'wrong' | 'complete' | 'levelup' | 'perfect';

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  switch (name) {
    case 'correct':
      tone(660, 0, 0.12);
      tone(880, 0.08, 0.16);
      break;
    case 'perfect':
      tone(660, 0, 0.1);
      tone(880, 0.08, 0.1);
      tone(1175, 0.16, 0.22);
      break;
    case 'wrong':
      tone(300, 0, 0.18, 0.035, 'triangle');
      break;
    case 'complete':
      tone(523, 0, 0.12);
      tone(659, 0.1, 0.12);
      tone(784, 0.2, 0.2);
      break;
    case 'levelup':
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22, 0.05));
      break;
  }
}
