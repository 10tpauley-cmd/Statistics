import type { ReactElement } from 'react';
import type { NpcId, RegionTheme } from '../../engine/pathway/types';

/* Original vector art for the Pathway. Colors come from per-region CSS variables (--rg-*) so every
   piece re-themes per region and between light and dark mode. */

const A = 'var(--rg-accent)';
const B = 'var(--rg-accent-2)';
const D = 'var(--rg-deep)';
const L = 'var(--rg-light)';
const INK = 'var(--rg-ink)';

export function Landmark({ kind, width = 260 }: { kind: string; width?: number }) {
  const h = (width * 160) / 240;
  return (
    <svg width={width} height={h} viewBox="0 0 240 160" aria-hidden="true" className="pw-landmark-svg">
      <ellipse cx="120" cy="150" rx="112" ry="9" fill={D} opacity="0.18" />
      {LANDMARKS[kind]?.() ?? LANDMARKS.gate()}
    </svg>
  );
}

const LANDMARKS: Record<string, () => ReactElement> = {
  village: () => (
    <g>
      <rect x="30" y="92" width="54" height="52" rx="3" fill={L} stroke={INK} strokeWidth="2" />
      <polygon points="24,94 57,62 90,94" fill={A} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="49" y="114" width="14" height="30" rx="2" fill={D} />
      <rect x="100" y="78" width="64" height="66" rx="3" fill={L} stroke={INK} strokeWidth="2" />
      <polygon points="93,80 132,44 171,80" fill={B} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="110" y="96" width="14" height="14" rx="2" fill={A} opacity="0.7" />
      <rect x="140" y="96" width="14" height="14" rx="2" fill={A} opacity="0.7" />
      <rect x="125" y="116" width="15" height="28" rx="2" fill={D} />
      <rect x="150" y="34" width="8" height="18" fill={D} />
      <circle cx="156" cy="26" r="5" fill={L} opacity="0.7" /><circle cx="162" cy="16" r="7" fill={L} opacity="0.5" />
      <rect x="180" y="112" width="40" height="32" rx="3" fill={L} stroke={INK} strokeWidth="2" />
      <polygon points="175,114 200,92 225,114" fill={A} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </g>
  ),
  camp: () => (
    <g>
      <polygon points="40,144 92,64 144,144" fill={A} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="80,144 92,96 104,144" fill={D} />
      <line x1="92" y1="64" x2="92" y2="50" stroke={INK} strokeWidth="2" /><polygon points="92,50 108,56 92,62" fill={B} />
      <g transform="translate(180 132)"><path d="M-14,10 L14,10" stroke={INK} strokeWidth="4" strokeLinecap="round" /><path d="M0,-20 C10,-8 8,2 0,8 C-8,2 -10,-8 0,-20Z" fill="#f59e0b" /><path d="M0,-8 C5,-2 4,3 0,6 C-4,3 -5,-2 0,-8Z" fill="#fde68a" /></g>
    </g>
  ),
  bridge: () => (
    <g>
      <path d="M0,130 Q60,120 120,130 T240,130 L240,160 L0,160Z" fill={B} opacity="0.55" />
      <path d="M20,104 Q120,40 220,104" fill="none" stroke={INK} strokeWidth="3" />
      <path d="M20,104 L220,104" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      {[50, 80, 110, 140, 170, 200].map((x) => <line key={x} x1={x} y1={104} x2={x} y2={104 - (1 - ((x - 120) / 100) ** 2) * 44} stroke={INK} strokeWidth="2" />)}
      <rect x="14" y="98" width="14" height="46" fill={A} stroke={INK} strokeWidth="2" /><rect x="212" y="98" width="14" height="46" fill={A} stroke={INK} strokeWidth="2" />
    </g>
  ),
  mountain: () => (
    <g>
      <polygon points="10,146 70,54 130,146" fill={B} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="70,146 140,24 210,146" fill={A} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="150,146 196,78 236,146" fill={B} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="122,56 140,24 158,56 148,50 140,58 131,50" fill="#fff" opacity="0.92" />
      <polygon points="60,70 70,54 80,70 74,66 70,72 66,66" fill="#fff" opacity="0.85" />
    </g>
  ),
  tower: () => (
    <g>
      <rect x="96" y="44" width="48" height="100" fill={L} stroke={INK} strokeWidth="2" />
      <rect x="90" y="34" width="60" height="14" fill={A} stroke={INK} strokeWidth="2" />
      {[90, 104, 118, 132].map((x) => <rect key={x} x={x} y="24" width="9" height="12" fill={A} stroke={INK} strokeWidth="2" />)}
      <rect x="112" y="70" width="16" height="22" rx="8" fill={D} /><rect x="111" y="114" width="18" height="30" rx="9" fill={D} />
      <line x1="120" y1="24" x2="120" y2="4" stroke={INK} strokeWidth="2" /><polygon points="120,4 140,10 120,16" fill={B} />
    </g>
  ),
  castle: () => (
    <g>
      <rect x="40" y="76" width="160" height="68" fill={L} stroke={INK} strokeWidth="2" />
      {[40, 58, 76, 94, 112, 130, 148, 166, 184].map((x) => <rect key={x} x={x} y="66" width="10" height="12" fill={L} stroke={INK} strokeWidth="2" />)}
      <rect x="20" y="46" width="34" height="98" fill={A} stroke={INK} strokeWidth="2" /><rect x="186" y="46" width="34" height="98" fill={A} stroke={INK} strokeWidth="2" />
      <polygon points="16,48 37,18 58,48" fill={B} stroke={INK} strokeWidth="2" /><polygon points="182,48 203,18 224,48" fill={B} stroke={INK} strokeWidth="2" />
      <path d="M104,144 L104,112 Q120,94 136,112 L136,144Z" fill={D} />
    </g>
  ),
  observatory: () => (
    <g>
      {[[20, 20], [60, 10], [200, 18], [222, 50], [36, 60], [170, 8]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill="#fde68a" />)}
      <rect x="62" y="96" width="116" height="48" fill={L} stroke={INK} strokeWidth="2" />
      <path d="M62,98 A58,58 0 0 1 178,98Z" fill={A} stroke={INK} strokeWidth="2" />
      <path d="M112,44 L128,44 L134,98 L106,98Z" fill={D} opacity="0.85" />
      <g transform="rotate(-32 120 70)"><rect x="112" y="22" width="18" height="56" rx="4" fill={B} stroke={INK} strokeWidth="2" /></g>
      <rect x="108" y="116" width="24" height="28" rx="12" fill={D} />
    </g>
  ),
  forest: () => (
    <g>
      {[[40, 144, 1.0], [86, 144, 1.3], [134, 144, 1.1], [180, 144, 1.35], [214, 144, 0.9]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-4" y="-18" width="8" height="18" fill={D} />
          <polygon points="-26,-18 0,-62 26,-18" fill={i % 2 ? A : B} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="-20,-40 0,-80 20,-40" fill={i % 2 ? B : A} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      ))}
      {[[60, 120], [158, 108], [110, 96]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#fde047" opacity="0.9" />)}
    </g>
  ),
  arena: () => (
    <g>
      <path d="M20,144 L20,84 Q120,44 220,84 L220,144Z" fill={L} stroke={INK} strokeWidth="2" />
      <path d="M20,84 Q120,44 220,84" fill="none" stroke={A} strokeWidth="8" />
      {[40, 70, 100, 130, 160, 190].map((x) => <path key={x} d={`M${x},144 L${x},112 Q${x + 11},98 ${x + 22},112 L${x + 22},144Z`} fill={D} opacity="0.75" />)}
      {[34, 120, 206].map((x) => <g key={x}><line x1={x} y1="60" x2={x} y2="30" stroke={INK} strokeWidth="2" /><polygon points={`${x},30 ${x + 18},36 ${x},42`} fill={B} /></g>)}
    </g>
  ),
  library: () => (
    <g>
      <polygon points="24,58 120,16 216,58" fill={A} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="28" y="58" width="184" height="10" fill={L} stroke={INK} strokeWidth="2" />
      {[40, 72, 104, 136, 168, 196].map((x) => <rect key={x} x={x - 6} y="68" width="12" height="66" fill={L} stroke={INK} strokeWidth="2" />)}
      <rect x="20" y="134" width="200" height="12" fill={B} stroke={INK} strokeWidth="2" />
      <circle cx="120" cy="40" r="8" fill="#fbbf24" stroke={INK} strokeWidth="1.5" />
    </g>
  ),
  river: () => (
    <g>
      {[0, 1, 2].map((i) => <path key={i} d={`M0,${108 + i * 14} Q40,${100 + i * 14} 80,${108 + i * 14} T160,${108 + i * 14} T240,${108 + i * 14}`} fill="none" stroke={i % 2 ? A : B} strokeWidth="6" strokeLinecap="round" opacity={0.8 - i * 0.15} />)}
    </g>
  ),
  gate: () => (
    <g>
      <rect x="44" y="40" width="30" height="104" fill={L} stroke={INK} strokeWidth="2" /><rect x="166" y="40" width="30" height="104" fill={L} stroke={INK} strokeWidth="2" />
      <path d="M44,44 Q120,-6 196,44 L196,60 Q120,16 44,60Z" fill={A} stroke={INK} strokeWidth="2" />
      <rect x="52" y="70" width="14" height="40" fill={B} /><rect x="174" y="70" width="14" height="40" fill={B} />
    </g>
  ),
};

/* ---------------- Small scenery glyphs (6 per theme) ---------------- */

type Glyph = () => ReactElement;
const tree: Glyph = () => <g><rect x="-3" y="-8" width="6" height="10" fill={D} /><circle cx="0" cy="-16" r="12" fill={A} /><circle cx="-7" cy="-11" r="8" fill={B} /></g>;
const pine: Glyph = () => <g><rect x="-2.5" y="-6" width="5" height="8" fill={D} /><polygon points="-12,-6 0,-34 12,-6" fill={A} /><polygon points="-9,-18 0,-40 9,-18" fill={B} /></g>;
const rock: Glyph = () => <path d="M-14,2 L-10,-8 L-2,-12 L9,-9 L14,2Z" fill={D} opacity="0.5" />;
const bush: Glyph = () => <g><circle cx="-7" cy="-5" r="7" fill={B} /><circle cx="4" cy="-7" r="9" fill={A} /><circle cx="11" cy="-3" r="5" fill={B} /></g>;
const house: Glyph = () => <g><rect x="-10" y="-14" width="20" height="16" fill={L} stroke={INK} strokeWidth="1.2" /><polygon points="-13,-13 0,-25 13,-13" fill={A} /></g>;
const flower: Glyph = () => <g><line x1="0" y1="0" x2="0" y2="-12" stroke={D} strokeWidth="1.5" /><circle cx="0" cy="-14" r="4" fill="#f472b6" /><circle cx="0" cy="-14" r="1.6" fill="#fde047" /></g>;
const star: Glyph = () => <polygon points="0,-12 3,-4 11,-4 5,1 7,9 0,4 -7,9 -5,1 -11,-4 -3,-4" fill="#fde68a" opacity="0.9" />;
const sparkle: Glyph = () => <path d="M0,-10 L2,-2 L10,0 L2,2 L0,10 L-2,2 L-10,0 L-2,-2Z" fill="#e0e7ff" opacity="0.9" />;
const moon: Glyph = () => <path d="M6,-12 A12,12 0 1 0 6,12 A9,9 0 1 1 6,-12Z" fill="#fef3c7" />;
const planet: Glyph = () => <g><circle r="8" fill={A} /><ellipse rx="15" ry="4" fill="none" stroke={L} strokeWidth="2" /></g>;
const mushroom: Glyph = () => <g><rect x="-3" y="-8" width="6" height="9" rx="2" fill="#fef3c7" /><path d="M-11,-7 Q0,-22 11,-7Z" fill="#ef4444" /><circle cx="-3" cy="-12" r="1.6" fill="#fff" /><circle cx="4" cy="-10" r="1.3" fill="#fff" /></g>;
const firefly: Glyph = () => <g><circle r="5" fill="#fde047" opacity="0.25" /><circle r="2" fill="#fde047" /></g>;
const fern: Glyph = () => <path d="M0,0 Q-2,-14 -10,-20 M0,0 Q2,-14 10,-20 M0,0 L0,-22" stroke={A} strokeWidth="2.5" fill="none" strokeLinecap="round" />;
const banner: Glyph = () => <g><line x1="0" y1="2" x2="0" y2="-30" stroke={INK} strokeWidth="2" /><path d="M0,-30 L16,-26 L12,-20 L16,-14 L0,-14Z" fill={A} /></g>;
const column: Glyph = () => <g><rect x="-5" y="-26" width="10" height="26" fill={L} stroke={INK} strokeWidth="1.2" /><rect x="-8" y="-29" width="16" height="4" fill={B} /></g>;
const torch: Glyph = () => <g><rect x="-2" y="-16" width="4" height="18" fill={D} /><path d="M0,-28 C6,-22 5,-17 0,-15 C-5,-17 -6,-22 0,-28Z" fill="#f59e0b" /></g>;
const shield: Glyph = () => <path d="M0,-18 L12,-13 L10,0 Q6,8 0,11 Q-6,8 -10,0 L-12,-13Z" fill={A} stroke={INK} strokeWidth="1.2" />;
const book: Glyph = () => <g><rect x="-11" y="-6" width="22" height="6" fill={A} /><rect x="-9" y="-12" width="18" height="6" fill={B} /><rect x="-10" y="-18" width="20" height="6" fill={L} stroke={INK} strokeWidth="1" /></g>;
const scroll: Glyph = () => <g><rect x="-10" y="-14" width="20" height="14" rx="2" fill="#fef3c7" stroke={INK} strokeWidth="1" /><circle cx="-10" cy="-7" r="3" fill={A} /><circle cx="10" cy="-7" r="3" fill={A} /></g>;
const candle: Glyph = () => <g><rect x="-3" y="-14" width="6" height="14" fill="#fef3c7" /><path d="M0,-22 C3,-19 3,-16 0,-15 C-3,-16 -3,-19 0,-22Z" fill="#f59e0b" /></g>;
const cloud: Glyph = () => <g opacity="0.8"><circle cx="-8" cy="-4" r="7" fill="#fff" /><circle cx="2" cy="-8" r="9" fill="#fff" /><circle cx="11" cy="-3" r="6" fill="#fff" /></g>;

const SCENERY: Record<RegionTheme, Glyph[]> = {
  village: [tree, bush, house, flower, rock, tree],
  highlands: [pine, rock, pine, cloud, bush, pine],
  observatory: [star, sparkle, moon, planet, star, sparkle],
  woods: [tree, mushroom, firefly, fern, pine, bush],
  arena: [banner, column, torch, shield, rock, banner],
  archive: [book, scroll, column, candle, book, sparkle],
};

export function Scenery({ theme, kind, scale, flip }: { theme: RegionTheme; kind: number; scale: number; flip: boolean }) {
  const G = SCENERY[theme][kind % 6];
  return <svg width="60" height="60" viewBox="-30 -45 60 60" style={{ transform: `scale(${flip ? -scale : scale}, ${scale})` }} aria-hidden="true"><G /></svg>;
}

/* ---------------- Cast portraits ---------------- */

export const NPCS: Record<NpcId, { name: string; role: string; color: string }> = {
  quill: { name: 'Professor Quill', role: 'Mentor', color: '#7c3aed' },
  vera: { name: 'Vera the Skeptic', role: 'Researcher', color: '#0d9488' },
  juno: { name: 'Juno the Explorer', role: 'Data explorer', color: '#ea580c' },
  odalys: { name: 'Odalys', role: 'Probability wizard', color: '#4f46e5' },
  thorne: { name: 'Archivist Thorne', role: 'Keeper of formulas', color: '#92400e' },
};

export function NpcAvatar({ id, size = 48 }: { id: NpcId; size?: number }) {
  const c = NPCS[id].color;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={NPCS[id].name} className="pw-npc-avatar">
      <circle cx="24" cy="24" r="23" fill={c} opacity="0.15" />
      <circle cx="24" cy="24" r="23" fill="none" stroke={c} strokeWidth="2" />
      <path d="M8,46 Q24,30 40,46Z" fill={c} />
      <circle cx="24" cy="21" r="10" fill="#fcd9b6" />
      <circle cx="20.5" cy="21" r="1.4" fill="#1e1b4b" /><circle cx="27.5" cy="21" r="1.4" fill="#1e1b4b" />
      <path d="M21,25.5 Q24,27.5 27,25.5" stroke="#1e1b4b" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {id === 'quill' && <><path d="M15,24 Q24,38 33,24 Q30,32 24,33 Q18,32 15,24Z" fill="#e5e7eb" /><path d="M34,6 Q40,12 33,20" stroke="#7c3aed" strokeWidth="2.5" fill="none" /></>}
      {id === 'vera' && <><circle cx="20.5" cy="21" r="3.6" fill="none" stroke="#1e1b4b" strokeWidth="1.2" /><circle cx="27.5" cy="21" r="3.6" fill="none" stroke="#1e1b4b" strokeWidth="1.2" /><path d="M14,18 Q24,4 34,18 Q30,12 24,12 Q18,12 14,18Z" fill="#78350f" /></>}
      {id === 'juno' && <><ellipse cx="24" cy="12" rx="15" ry="3.5" fill="#a16207" /><path d="M16,12 Q24,1 32,12Z" fill="#ca8a04" /></>}
      {id === 'odalys' && <><path d="M12,14 L24,-2 L36,14Z" fill="#4f46e5" /><circle cx="27" cy="7" r="1.5" fill="#fde68a" /><circle cx="21" cy="10" r="1" fill="#fde68a" /></>}
      {id === 'thorne' && <><path d="M12,24 Q12,6 24,6 Q36,6 36,24 L33,24 Q33,11 24,11 Q15,11 15,24Z" fill="#78350f" /><rect x="17" y="19.5" width="6" height="3" rx="1.5" fill="none" stroke="#1e1b4b" strokeWidth="1" /><rect x="25" y="19.5" width="6" height="3" rx="1.5" fill="none" stroke="#1e1b4b" strokeWidth="1" /></>}
    </svg>
  );
}

export function NpcBubble({ id, text }: { id: NpcId; text: string }) {
  return (
    <div className="pw-npc">
      <NpcAvatar id={id} />
      <div className="pw-npc-bubble">
        <div className="pw-npc-name" style={{ color: NPCS[id].color }}>{NPCS[id].name} <span>· {NPCS[id].role}</span></div>
        <div>{text}</div>
      </div>
    </div>
  );
}
