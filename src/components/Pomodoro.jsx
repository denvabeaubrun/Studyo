import { useCallback, useEffect, useRef, useState } from "react";
import "./Pomodoro.css";

const MODES = {
  focus: { label: "Focus", title: "Focus Time", minutes: 25 },
  short: { label: "Short", title: "Short Break", minutes: 5 },
  long: { label: "Long", title: "Long Break", minutes: 15 },
};
const MODE_ORDER = ["focus", "short", "long"];

// Drop audio files in public/music and list them here.
// BASE_URL keeps paths working on GitHub Pages (/Studyo/).
const BASE = import.meta.env.BASE_URL;
// artist shows on the pod's screen, which also covers credit for licenses that ask for it.
const TRACKS = [
  // { title: "Track name", artist: "Artist name", src: `${BASE}music/track-name.mp3` },
];

// Your YouTube songs. Paste each song's YouTube link into url.
// Any link format works (youtube.com/watch?v=..., youtu.be/..., music.youtube.com/...).
// If a video won't play here, its uploader has blocked embedding: try a lyric or audio upload instead.
const YT_SONGS = [
  { title: "Saturn", artist: "Sleeping At Last", url: "" },
  { title: "Faded", artist: "Alan Walker", url: "" },
  { title: "Mercury", artist: "Sleeping At Last", url: "" },
  { title: "The Night We Met", artist: "Lord Huron", url: "" },
];

function ytId(url) {
  const m = (url || "").match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Loads YouTube's player script once, the first time a song is picked.
let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return ytApiPromise;
}

const isPhone = () => window.matchMedia("(max-width: 860px)").matches;

const AMBIENT = [
  { id: "rain", label: "Rain" },
  { id: "brown", label: "Brown Noise" },
];
const AMBIENT_GAIN = { brown: 1, rain: 0.4 };

const pad = (n) => String(n).padStart(2, "0");
const fmt = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

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

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z" /></svg>
);
const PrevIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2.5v14H6zM20 5v14l-10-7z" /></svg>
);
const NextIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 5H18v14h-2.5zM4 5l10 7-10 7z" /></svg>
);
const PlayPauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 5l9 7-9 7zM14 5h2.5v14H14zM19 5h2.5v14H19z" /></svg>
);

/**
 * open / onOpenChange control the full-screen sheet on phones.
 * On wider screens the pod is always shown and these do nothing.
 */
export default function Pomodoro({ open = false, onOpenChange = () => {} }) {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(MODES.focus.minutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);

  const [sound, setSound] = useState("off"); // off | rain | brown | track | youtube
  const [trackIdx, setTrackIdx] = useState(0);
  const [ytIdx, setYtIdx] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const [toast, setToast] = useState("");
  const [showVolume, setShowVolume] = useState(false);

  const endAt = useRef(null);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const audioRef = useRef(null);
  const baseTitle = useRef(document.title);
  const lastChoice = useRef({ id: "rain", idx: 0 });
  const wheelRef = useRef(null);
  const suppressClick = useRef(false);
  const toastTimer = useRef(null);
  const volumeTimer = useRef(null);

  // YouTube player
  const ytWrap = useRef(null);
  const ytPlayer = useRef(null);
  const ytReady = useRef(false);
  const ytLoadedId = useRef(null);
  const latest = useRef({});

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

  // The little click the wheel makes.
  const tick = () => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = "square";
      osc.frequency.value = 1800;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.03);
    } catch {
      /* audio blocked, ignore */
    }
  };

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  };

  const changeVolume = (delta) => {
    setVolume((v) => Math.min(1, Math.max(0, Math.round((v + delta) * 20) / 20)));
    setShowVolume(true);
    clearTimeout(volumeTimer.current);
    volumeTimer.current = setTimeout(() => setShowVolume(false), 1200);
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

  // Session finished: chime, stop the music, move to the next mode.
  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    chime();
    setSound("off");
    const nextDone = mode === "focus" ? done + 1 : done;
    if (mode === "focus") setDone(nextDone);
    const next = mode !== "focus" ? "focus" : nextDone % 4 === 0 ? "long" : "short";
    flash(
      next === "focus"
        ? "Break's over. Press the center button to focus."
        : next === "long"
        ? "Four sessions done. Take a long break."
        : "Focus done. Time for a short break."
    );
    switchMode(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  // Tab title shows the countdown, and restores the original when stopped or unmounted.
  useEffect(() => {
    document.title = running ? `${fmt(secondsLeft)} · ${MODES[mode].title}` : baseTitle.current;
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

  // YouTube songs. The player is created the first time one is picked, then reused.
  useEffect(() => {
    if (sound !== "youtube") {
      if (ytReady.current) ytPlayer.current.pauseVideo();
      return;
    }
    const id = ytId(YT_SONGS[ytIdx].url);
    if (!id) {
      flash(`Add a YouTube link for "${YT_SONGS[ytIdx].title}" in Pomodoro.jsx`);
      return;
    }
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled) return;
      if (!ytPlayer.current) {
        const el = document.createElement("div");
        ytWrap.current.appendChild(el);
        ytLoadedId.current = id;
        ytPlayer.current = new window.YT.Player(el, {
          width: "100%",
          height: "100%",
          videoId: id,
          playerVars: { playsinline: 1, rel: 0 },
          events: {
            onReady: (e) => {
              ytReady.current = true;
              e.target.setVolume(Math.round(latest.current.volume * 100));
              const want = ytId(YT_SONGS[latest.current.ytIdx].url);
              if (latest.current.sound !== "youtube") return;
              if (want && want !== ytLoadedId.current) {
                ytLoadedId.current = want;
                e.target.loadVideoById(want);
              } else {
                e.target.playVideo();
              }
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) latest.current.nextSong();
            },
            onError: () => {
              latest.current.flash("That video can't play here. Skipping to the next song.");
              latest.current.nextSong();
            },
          },
        });
      } else if (ytReady.current) {
        if (ytLoadedId.current !== id) {
          ytLoadedId.current = id;
          ytPlayer.current.loadVideoById(id);
        } else {
          ytPlayer.current.playVideo();
        }
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sound, ytIdx]);

  // On phones the video can't keep playing behind the closed sheet, so it pauses.
  useEffect(() => {
    if (!open && sound === "youtube" && isPhone()) setSound("off");
  }, [open, sound]);

  // Volume.
  useEffect(() => {
    if (masterRef.current) masterRef.current.gain.value = volume * (AMBIENT_GAIN[sound] ?? 1);
    if (audioRef.current) audioRef.current.volume = volume;
    if (ytReady.current) ytPlayer.current.setVolume(Math.round(volume * 100));
  }, [volume, sound]);

  // Escape closes the phone sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Drag around the wheel to change volume. Taps still hit the buttons.
  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    let drag = null;
    const angleOf = (e) => {
      const r = wheel.getBoundingClientRect();
      return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    };
    const down = (e) => {
      if (e.target.closest(".pod-center")) return;
      drag = { last: angleOf(e), moved: 0, acc: 0 };
    };
    const move = (e) => {
      if (!drag) return;
      const a = angleOf(e);
      let d = a - drag.last;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      drag.last = a;
      drag.moved += Math.abs(d);
      drag.acc += d;
      if (drag.moved > 12) {
        while (Math.abs(drag.acc) >= 15) {
          const s = Math.sign(drag.acc);
          changeVolume(s * 0.05);
          tick();
          drag.acc -= s * 15;
        }
      }
    };
    const up = () => {
      if (drag && drag.moved > 12) {
        suppressClick.current = true;
        setTimeout(() => { suppressClick.current = false; }, 0);
      }
      drag = null;
    };
    wheel.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      wheel.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (opt) => {
    setSound(opt.id);
    if (opt.id === "track") setTrackIdx(opt.idx);
    if (opt.id === "youtube") setYtIdx(opt.idx);
    if (opt.id !== "off") lastChoice.current = opt;
  };

  const toggleMusic = () => {
    tick();
    if (sound !== "off") setSound("off");
    else choose(lastChoice.current);
  };

  // Every sound except "off", in the order the skip buttons move through them.
  const playable = [
    ...YT_SONGS.map((t, i) => ({ id: "youtube", idx: i, label: t.title })),
    ...TRACKS.map((t, i) => ({ id: "track", idx: i, label: t.title })),
    ...AMBIENT,
  ];
  const hasIdx = (id) => id === "track" || id === "youtube";
  const matches = (o, ref) => o.id === ref.id && (!hasIdx(o.id) || o.idx === ref.idx);
  const currentIdx =
    sound === "off"
      ? -1
      : playable.findIndex((o) => matches(o, { id: sound, idx: sound === "youtube" ? ytIdx : trackIdx }));

  const skip = (dir) => {
    tick();
    const from = currentIdx >= 0 ? currentIdx : Math.max(0, playable.findIndex((o) => matches(o, lastChoice.current)));
    choose(playable[(from + dir + playable.length) % playable.length]);
  };

  // When a YouTube song ends, go to the next YouTube song.
  const nextSong = () => setYtIdx((i) => (i + 1) % YT_SONGS.length);
  latest.current = { volume, sound, ytIdx, nextSong, flash };

  // Center button: the timer and the music start and stop together.
  const toggleTimer = () => {
    const next = !running;
    setRunning(next);
    if (next && sound === "off") {
      // A YouTube song needs the full pod open on phones, since the video has to be visible.
      if (lastChoice.current.id === "youtube" && isPhone() && !open) onOpenChange(true);
      choose(lastChoice.current);
    }
    if (!next) setSound("off");
  };

  // MENU: mid-session it resets; otherwise it moves to the next mode.
  const menu = () => {
    tick();
    if (running) setSound("off");
    if (secondsLeft < total) {
      switchMode(mode);
      flash(`${MODES[mode].title} reset`);
    } else {
      switchMode(MODE_ORDER[(MODE_ORDER.indexOf(mode) + 1) % MODE_ORDER.length]);
    }
  };

  const onPodKey = (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); changeVolume(0.05); }
    if (e.key === "ArrowDown") { e.preventDefault(); changeVolume(-0.05); }
  };

  const soundLabel =
    sound === "off"
      ? "Music off"
      : sound === "youtube"
      ? YT_SONGS[ytIdx].title
      : sound === "track"
      ? TRACKS[trackIdx].title
      : AMBIENT.find((a) => a.id === sound).label;
  const artist =
    sound === "youtube" ? YT_SONGS[ytIdx].artist : sound === "track" ? TRACKS[trackIdx].artist : null;
  const videoMode = sound === "youtube";

  const progress = 1 - secondsLeft / total;
  const timerLabel = running ? "Pause timer" : "Start timer";
  const sessionLabel = mode === "focus" ? `Session ${(done % 4) + 1} of 4` : MODES[mode].title;

  return (
    <div className={`pod${open ? " pod--open" : ""}`} data-mode={mode}>
      {/* Phones: slim player pinned to the bottom of the screen */}
      <div className="pod-mini">
        <button className="pod-mini-open" onClick={() => onOpenChange(true)} aria-label="Open Pomodoro timer">
          <span className="pod-mini-time">{fmt(secondsLeft)}</span>
          <span className="pod-mini-info">
            <span className="pod-mini-mode">{MODES[mode].title}</span>
            <span className="pod-mini-sound">{sound !== "off" ? `♪ ${soundLabel}` : soundLabel}</span>
          </span>
        </button>
        <button className="pod-mini-play" onClick={toggleTimer} aria-label={timerLabel}>
          {running ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <div
        className="pod-sheet"
        onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
      >
        <section className="pod-body" aria-label="Pomodoro Timer" onKeyDown={onPodKey}>
          <h3 className="pod-title">⏱ Pomodoro Timer</h3>

          <div className={`pod-screen${videoMode ? " pod-screen--video" : ""}`}>
            <div className="pod-status">
              <span>
                {MODES[mode].title}
                {videoMode && <span className="pod-status-time">{fmt(secondsLeft)}</span>}
              </span>
              <span className="pod-status-right">
                <span className={`pod-note${sound !== "off" ? " is-on" : ""}`} aria-hidden="true">♪</span>
                <span className="pod-battery" aria-hidden="true">
                  <span style={{ width: `${Math.max(8, 100 - progress * 100)}%` }} />
                </span>
              </span>
            </div>

            {/* YouTube's player shows here while a song plays; their rules require it to stay visible */}
            <div className="pod-video" ref={ytWrap} />

            <div className="pod-digits" role="timer">{fmt(secondsLeft)}</div>
            <div className="pod-label">{sessionLabel}</div>
            <div className="pod-bar" aria-hidden="true">
              <div style={{ width: `${progress * 100}%` }} />
            </div>

            <div className="pod-now">
              <div className="pod-track">{soundLabel}</div>
              <div className="pod-sub">
                {sound === "off"
                  ? "Press ▶❚❚ to play"
                  : artist || `Sound ${currentIdx + 1} of ${playable.length}`}
              </div>
            </div>

            <div className={`pod-overlay pod-volume${showVolume ? " is-shown" : ""}`} aria-hidden="true">
              <span>Vol</span>
              <div className="pod-volume-segs">
                {Array.from({ length: 20 }, (_, i) => (
                  <i key={i} className={i < Math.round(volume * 20) ? "is-on" : ""} />
                ))}
              </div>
            </div>
            <div className={`pod-overlay${toast ? " is-shown" : ""}`} role="status" aria-live="polite">
              {toast}
            </div>
          </div>

          <div
            className="pod-wheel"
            ref={wheelRef}
            onClickCapture={(e) => {
              if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); }
            }}
          >
            <button className="pod-wb pod-wb-menu" onClick={menu} aria-label={secondsLeft < total ? "Reset timer" : "Change timer mode"}>
              MENU
            </button>
            <button className="pod-wb pod-wb-prev" onClick={() => skip(-1)} aria-label="Previous sound"><PrevIcon /></button>
            <button className="pod-wb pod-wb-next" onClick={() => skip(1)} aria-label="Next sound"><NextIcon /></button>
            <button className="pod-wb pod-wb-play" onClick={toggleMusic} aria-label="Play or pause music" aria-pressed={sound !== "off"}>
              <PlayPauseIcon />
            </button>
            <button className="pod-center" onClick={toggleTimer} aria-label={timerLabel}>
              {running ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>
        </section>

        <button className="pod-done" onClick={() => onOpenChange(false)}>Done</button>
      </div>

      <audio
        ref={audioRef}
        loop={TRACKS.length === 1}
        onEnded={() => setTrackIdx((i) => (i + 1) % TRACKS.length)}
      />
    </div>
  );
}
