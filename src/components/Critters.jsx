import "./Critters.css";

// Studyo's little walking crew. Purely decorative, so screen readers skip it.
const INK = "#1a1a1a";
const line = { stroke: INK, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" };

function Feet() {
  return (
    <>
      <ellipse className="c-foot c-foot-l" cx="23" cy="54" rx="5" ry="3" fill={INK} />
      <ellipse className="c-foot c-foot-r" cx="37" cy="54" rx="5" ry="3" fill={INK} />
    </>
  );
}

function Face({ y = 35, cheeks = true }) {
  return (
    <>
      <circle cx="24" cy={y} r="2.2" fill={INK} />
      <circle cx="36" cy={y} r="2.2" fill={INK} />
      {cheeks && <circle cx="19.5" cy={y + 5} r="2.6" fill="#f3a6a6" />}
      {cheeks && <circle cx="40.5" cy={y + 5} r="2.6" fill="#f3a6a6" />}
      <path d={`M27 ${y + 5} Q30 ${y + 8} 33 ${y + 5}`} fill="none" {...line} strokeWidth="2" />
    </>
  );
}

// Mochi: a round blob with a sprout
function Mochi() {
  return (
    <svg viewBox="0 0 60 60">
      <Feet />
      <g className="c-body">
        <line x1="30" y1="21" x2="30" y2="14" {...line} />
        <path d="M30 14 C29 8 33 4 39 5 C38 10 34 13 30 14 Z" fill="#7dd3a0" {...line} />
        <ellipse cx="30" cy="37" rx="18" ry="16" fill="#fff8f0" {...line} />
        <Face y={35} />
      </g>
    </svg>
  );
}

// Bix: a walking book
function Bix() {
  return (
    <svg viewBox="0 0 60 60">
      <Feet />
      <g className="c-body">
        <rect x="14" y="16" width="32" height="35" rx="5" fill="#5bc0eb" {...line} />
        <rect x="14" y="16" width="8" height="35" rx="4" fill="#3da1cc" {...line} />
        <rect x="26" y="21" width="15" height="6" rx="2" fill="#fff8f0" {...line} strokeWidth="2" />
        <g transform="translate(3 0)"><Face y={36} cheeks={false} /></g>
      </g>
    </svg>
  );
}

// Nutmeg: a little acorn
function Nutmeg() {
  return (
    <svg viewBox="0 0 60 60">
      <Feet />
      <g className="c-body">
        <ellipse cx="30" cy="38" rx="15" ry="14" fill="#fbbf24" {...line} />
        <path d="M13 31 Q30 12 47 31 Z" fill="#a0672f" {...line} />
        <line x1="30" y1="20" x2="32" y2="14" {...line} />
        <Face y={39} />
      </g>
    </svg>
  );
}

const CREW = [
  { Critter: Mochi, duration: 42, delay: 0 },
  { Critter: Bix, duration: 36, delay: -13 },
  { Critter: Nutmeg, duration: 48, delay: -30 },
];

export default function Critters() {
  return (
    <div className="critters" aria-hidden="true">
      {CREW.map(({ Critter, duration, delay }, i) => (
        <div
          key={i}
          className={`critter critter-${i + 1}`}
          style={{ "--dur": `${duration}s`, "--delay": `${delay}s` }}
        >
          <Critter />
        </div>
      ))}
    </div>
  );
}
