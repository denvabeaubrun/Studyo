import "./Stars.css";

// A wide dome of tiny twinkling stars across the top of the homepage.
// The field reaches high over the headline and curves down at the sides.
// Positions come from a fixed seed, so they look the same on every visit.

const W = 1400;
const H = 260;
const COUNT = 120;

function seeded(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// How far down the star field reaches at a given x: shallow in the middle
// (above the headline), deeper toward the sides, like the inside of a dome.
const floorAt = (x) => 96 + 150 * Math.pow(Math.abs(x - W / 2) / (W / 2), 3);

function makeStars() {
  const rand = seeded(7);
  const stars = [];
  let tries = 0;
  while (stars.length < COUNT && tries < 5000) {
    tries++;
    const x = 10 + rand() * (W - 20);
    const y = 8 + rand() * (H - 16);
    if (y > floorAt(x)) continue;
    if (x > 300 && x < 1100 && y > 96) continue; // keep the headline clear
    // a little denser near the curved edge, so the dome shape reads
    const nearEdge = floorAt(x) - y < 45;
    if (!nearEdge && rand() < 0.35) continue;
    const roll = rand();
    const sparkle = roll < 0.18;
    stars.push({
      x,
      y,
      side: y > 100, // the low stars at the sides, hidden on phones
      kind: sparkle ? "sparkle" : "dot",
      size: sparkle ? 5 + rand() * 4.5 : 1.1 + rand() * 1.9,
      gold: rand() < 0.45,
      delay: -(rand() * 4).toFixed(2),
      duration: (2.4 + rand() * 2.6).toFixed(2),
    });
  }
  return stars;
}

const STARS = makeStars();

// A four-point sparkle centered on 0,0
const sparklePath = (s) =>
  `M 0 ${-s} Q ${s * 0.18} ${-s * 0.18} ${s} 0 Q ${s * 0.18} ${s * 0.18} 0 ${s} Q ${-s * 0.18} ${s * 0.18} ${-s} 0 Q ${-s * 0.18} ${-s * 0.18} 0 ${-s} Z`;

export default function Stars() {
  return (
    <svg className="star-dome" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {STARS.map((s, i) => (
        <g
          key={i}
          className={s.side ? "star-side" : undefined}
          transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`}
        >
          <g
            className="star"
            style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
          >
            {s.kind === "sparkle" ? (
              <path d={sparklePath(s.size)} className={s.gold ? "star-gold" : "star-ink"} />
            ) : (
              <circle r={s.size} className={s.gold ? "star-gold-dot" : "star-ink-dot"} />
            )}
          </g>
        </g>
      ))}
    </svg>
  );
}
