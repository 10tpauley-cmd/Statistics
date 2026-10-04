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

function tone(freq: number, start: number, dur: number, gain = 0.05, type: OscillatorType = 'sine', slideTo?: number) {
  const c = ac();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.02);
}

export type SoundName =
  | 'correct' | 'wrong' | 'complete' | 'levelup' | 'perfect'
  | 'click' | 'select' | 'combo' | 'star' | 'unlock' | 'hit' | 'shield' | 'whoosh' | 'victory' | 'coin';

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
    case 'click':
      tone(1800, 0, 0.025, 0.012, 'square');
      break;
    case 'select':
      tone(990, 0, 0.05, 0.025, 'triangle');
      break;
    case 'combo':
      tone(784, 0, 0.08, 0.04);
      tone(988, 0.06, 0.08, 0.04);
      tone(1319, 0.12, 0.16, 0.045);
      break;
    case 'star':
      tone(1319, 0, 0.12, 0.04);
      tone(1760, 0.07, 0.2, 0.035);
      break;
    case 'unlock':
      tone(440, 0, 0.12, 0.04, 'triangle', 880);
      tone(1175, 0.12, 0.2, 0.035);
      break;
    case 'hit':
      tone(180, 0, 0.12, 0.06, 'sawtooth', 70);
      tone(1200, 0, 0.05, 0.02, 'square');
      break;
    case 'shield':
      tone(520, 0, 0.18, 0.04, 'triangle', 260);
      break;
    case 'whoosh':
      tone(300, 0, 0.25, 0.025, 'sine', 1200);
      break;
    case 'coin':
      tone(988, 0, 0.06, 0.035, 'square');
      tone(1319, 0.06, 0.14, 0.03, 'square');
      break;
    case 'victory':
      [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, i * 0.11, 0.3, 0.05));
      tone(1568, 0.6, 0.5, 0.04);
      break;
  }
}
