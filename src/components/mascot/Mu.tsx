export type MuMood = 'idle' | 'happy' | 'proud' | 'encourage' | 'thinking' | 'wave';

/** Mu — a little bell curve with a face. Pure SVG so it themes and scales cleanly. */
export function Mu({ mood = 'idle', size = 56, className = '' }: { mood?: MuMood; size?: number; className?: string }) {
  const closedEyes = mood === 'proud' || mood === 'happy';
  const lookUp = mood === 'thinking';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Mu, your statistics helper">
      <defs>
        <linearGradient id="mu-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="mu-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* axis "feet" */}
      <line x1="6" y1="56" x2="58" y2="56" stroke="#312e81" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <line x1="22" y1="56" x2="22" y2="59" stroke="#312e81" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <line x1="42" y1="56" x2="42" y2="59" stroke="#312e81" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      {/* bell-curve body */}
      <path d="M4 55 C 15 55, 19 10, 32 10 C 45 10, 49 55, 60 55 Z" fill="url(#mu-body)" />
      <path d="M17 52 C 22 50, 24 22, 32 20 C 40 22, 42 50, 47 52 Z" fill="url(#mu-belly)" />
      {/* mean line (dashed) */}
      <line x1="32" y1="44" x2="32" y2="54" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="2 2" />
      {/* arms */}
      {mood === 'wave' ? (
        <path d="M49 36 q 7 -6 6 -14" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0 49 36; -18 49 36; 0 49 36" dur="0.9s" repeatCount="indefinite" />
        </path>
      ) : mood === 'proud' || mood === 'encourage' ? (
        <>
          <path d="M15 38 q -6 -4 -6 -11" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M49 38 q 6 -4 6 -11" stroke="#4f46e5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : null}
      {/* eyes */}
      {closedEyes ? (
        <>
          <path d="M23 30 q 3 -4 6 0" stroke="#1e1b4b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M35 30 q 3 -4 6 0" stroke="#1e1b4b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="26" cy="30" rx="4" ry="4.6" fill="#fff" />
          <ellipse cx="38" cy="30" rx="4" ry="4.6" fill="#fff" />
          <circle cx={lookUp ? 27 : 26.6} cy={lookUp ? 28 : 31} r="2.1" fill="#1e1b4b" />
          <circle cx={lookUp ? 39 : 38.6} cy={lookUp ? 28 : 31} r="2.1" fill="#1e1b4b" />
          <circle cx="27.4" cy="29.4" r="0.7" fill="#fff" />
          <circle cx="39.4" cy="29.4" r="0.7" fill="#fff" />
        </>
      )}
      {/* cheeks */}
      <ellipse cx="21" cy="37" rx="2.6" ry="1.5" fill="#f472b6" opacity="0.55" />
      <ellipse cx="43" cy="37" rx="2.6" ry="1.5" fill="#f472b6" opacity="0.55" />
      {/* mouth */}
      {mood === 'thinking' ? (
        <path d="M29 39 h 6" stroke="#1e1b4b" strokeWidth="2" strokeLinecap="round" />
      ) : mood === 'encourage' ? (
        <path d="M28 38 q 4 3 8 0" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M27 37.5 q 5 5.5 10 0" stroke="#1e1b4b" strokeWidth="2" fill={mood === 'proud' || mood === 'happy' ? '#be185d' : 'none'} strokeLinecap="round" />
      )}
      {/* extras */}
      {mood === 'proud' && <path d="M52 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#fbbf24" />}
      {mood === 'thinking' && (
        <g fill="#818cf8">
          <circle cx="48" cy="14" r="1.6" /><circle cx="53" cy="10" r="2.1" /><circle cx="59" cy="6" r="2.6" />
        </g>
      )}
    </svg>
  );
}
