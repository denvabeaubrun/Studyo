import { useCallback, useEffect, useRef, useState } from "react";
import "./Pomodoro.css";

const MODES = {
  focus: { label: "Focus", title: "Focus Time", minutes: 25 },
  short: { label: "Short", title: "Short Break", minutes: 5 },
  long: { label: "Long", title: "Long Break", minutes: 15 },
};

// Drop audio files in public/music and list them here.
// BASE_URL keeps paths working on GitHub Pages (/Studyo/).
const BASE = import.meta.env.BASE_URL;
const TRACKS = [
  // { title: "Track name", src: `${BASE}music/track-1.mp3` },
];

const AMBIENT = [
  { id: "rain", label: "Rain" },
  { id: "brown", label: "Brown Noise" },
];
const AMBIENT_GAIN = { brown: 1, rain: 0.4 };

const pad = (n) => String(n).padStart(2, "0");

function makeNoise(ctx, type) {
  const len = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === "brown") {
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    } else {
      data[i] = w;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

export default function Pomodoro() {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  const [sound, setSound] = useState("off"); // off | rain | brown | track
  const [trackIdx, setTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [open, setOpen] = useState(false);

  const endAt = useRef(null);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const audioRef = useRef(null);
  const baseTitle = useRef(document.title);
  const lastChoice = useRef({ id: "rain", idx: 0 });

  const total = MODES[mode].minutes * 60;

  const getCtx = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    ctxRef.current.resume();
    return ctxRef.current;
  };

  const chime = () => {
    try {
      const ctx = getCtx();
      [660, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const t = ctx.currentTime + i * 0.22;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1);
      });
    } catch {
      /* audio blocked, ignore */
    }
  };

  const switchMode = useCallback((m) => {
    setMode(m);
    setRunning(false);
    endAt.current = null;
    setSecondsLeft(MODES[m].minutes * 60);
  }, []);

  // Countdown. Uses an end timestamp so it stays accurate in background tabs.
  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + secondsLeft * 1000;
    const id = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((endAt.current - Date.now()) / 1000)));
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Session finished.
  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    chime();
    const nextDone = mode === "focus" ? done + 1 : done;
    if (mode === "focus") setDone(nextDone);
    switchMode(mode !== "focus" ? "focus" : nextDone % 4 === 0 ? "long" : "short");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  // Tab title shows the countdown, and restores the original when stopped or unmounted.
  useEffect(() => {
    document.title = running
      ? `${pad(Math.floor(secondsLeft / 60))}:${pad(secondsLeft % 60)} · ${MODES[mode].title}`
      : baseTitle.current;
  }, [secondsLeft, running, mode]);
  useEffect(() => () => { document.title = baseTitle.current; }, []);

  // Generated ambient sounds (no audio files needed).
  useEffect(() => {
    if (sound !== "brown" && sound !== "rain") return;
    const ctx = getCtx();
    const master = ctx.createGain();
    master.gain.value = volume * AMBIENT_GAIN[sound];
    const src = makeNoise(ctx, sound === "brown" ? "brown" : "white");
    let tail = src;
    if (sound === "rain") {
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 7000;
      src.connect(hp);
      hp.connect(lp);
      tail = lp;
    }
    tail.connect(master);
    master.connect(ctx.destination);
    src.start();
    masterRef.current = master;
    return () => {
      src.stop();
      master.disconnect();
      masterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound]);

  // Your own tracks.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (sound === "track" && TRACKS.length) {
      a.src = TRACKS[trackIdx].src;
      a.volume = volume;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound, trackIdx]);

  // Volume.
  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = volume * (AMBIENT_GAIN[sound] ?? 1);
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, sound]);

  const choose = (opt) => {
    setSound(opt.id);
    if (opt.id === "track") setTrackIdx(opt.idx);
    if (opt.id !== "off") lastChoice.current = opt;
  };

  const toggleMusic = () => {
    if (sound !== "off") setSound("off");
    else choose(lastChoice.current);
  };

  const options = [
    { id: "off", label: "Off" },
    ...AMBIENT,
    ...TRACKS.map((t, i) => ({ id: "track", idx: i, label: t.title })),
  ];
  const isOn = (o) => sound === o.id && (o.id !== "track" || trackIdx === o.idx);
  const soundLabel =
    sound === "off"
      ? "Choose Music"
      : sound === "track"
      ? TRACKS[trackIdx].title
      : AMBIENT.find((a) => a.id === sound).label;

  const progress = 1 - secondsLeft / total;

  return (
    <section className="pomo-card" data-mode={mode} aria-label="Pomodoro Timer">
      <h3 className="pomo-title">⏱ Pomodoro Timer</h3>

      <div className="pomo-tabs" role="group" aria-label="Timer mode">
        {Object.entries(MODES).map(([key, m]) => (
          <button key={key} aria-pressed={mode === key} onClick={() => switchMode(key)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="pomo-digits" role="timer">
        {pad(Math.floor(secondsLeft / 60))}:{pad(secondsLeft % 60)}
      </div>
      <div className="pomo-label">{MODES[mode].title}</div>
      <div className="pomo-bar" aria-hidden="true">
        <div style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="pomo-controls">
        <button className="pomo-start" onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : secondsLeft < total ? "Resume" : "Start"}
        </button>
        <button className="pomo-btn" onClick={() => switchMode(mode)}>
          Reset
        </button>
        <button
          className="pomo-btn pomo-note"
          onClick={toggleMusic}
          aria-pressed={sound !== "off"}
          aria-label="Music on or off"
        >
          🎵
        </button>
      </div>

      <button className="pomo-music-row" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        🎵 {soundLabel} <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="pomo-music-panel">
          {options.map((o) => (
            <button
              key={o.id + (o.idx ?? "")}
              className="pomo-option"
              aria-pressed={isOn(o)}
              onClick={() => choose(o)}
            >
              {o.label}
            </button>
          ))}
          <label className="pomo-volume">
            Volume
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      <audio
        ref={audioRef}
        loop={TRACKS.length === 1}
        onEnded={() => setTrackIdx((i) => (i + 1) % TRACKS.length)}
      />
    </section>
  );
}
