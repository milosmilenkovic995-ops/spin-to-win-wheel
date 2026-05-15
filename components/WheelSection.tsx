"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PrizeType = "10off" | "20off" | "freeship";
type Phase = "idle" | "spinning" | "revealing" | "done";

interface PrizeConfig {
  title: string;
  label: string;
  code: string;
  description: string;
  emoji: string;
}

const PRIZES: Record<PrizeType, PrizeConfig> = {
  "10off":    { title: "You Won 10% Off!",        label: "10% OFF",       code: "SAVE10",   description: "Save 10% on your entire order — no minimum required.",         emoji: "🎉" },
  "20off":    { title: "You Won 20% Off!",        label: "20% OFF",       code: "SAVE20",   description: "Save 20% on your entire order — our biggest discount!",         emoji: "🎊" },
  freeship:   { title: "You Won Free Shipping!",  label: "FREE SHIPPING", code: "FREESHIP", description: "Free shipping on your next order — no minimum, no catches.",    emoji: "📦" },
};

interface Slice { type: PrizeType; label: string; sublabel: string; fill: string; text: string; }

const SLICES: Slice[] = [
  { type: "10off",    label: "10% Off", sublabel: "your order", fill: "#208b47", text: "#ffffff" },
  { type: "freeship", label: "Free",    sublabel: "Shipping",   fill: "#f0fdf4", text: "#208b47" },
  { type: "20off",    label: "20% Off", sublabel: "your order", fill: "#1a7a40", text: "#ffffff" },
  { type: "10off",    label: "10% Off", sublabel: "your order", fill: "#16653a", text: "#ffffff" },
  { type: "freeship", label: "Free",    sublabel: "Shipping",   fill: "#dcfce7", text: "#208b47" },
  { type: "20off",    label: "20% Off", sublabel: "your order", fill: "#0f4e2b", text: "#ffffff" },
];

const NUM       = SLICES.length;
const SLICE_DEG = 360 / NUM;
const SIZE      = 440;
const SPIN_MS   = 7000;
const STORAGE_KEY = "znf_wheel_v1";

const CONFETTI_COLORS = ["#208b47","#16a34a","#fbbf24","#f59e0b","#3b82f6","#8b5cf6","#ef4444","#ec4899","#ffffff"];

function drawWheel(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r  = cx - 8;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < NUM; i++) {
    const start = -Math.PI / 2 + i * (2 * Math.PI) / NUM;
    const end   = start + (2 * Math.PI) / NUM;
    const mid   = start + (2 * Math.PI) / NUM / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle   = SLICES[i].fill;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 3;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid);
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle    = SLICES[i].text;
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillText(SLICES[i].label,    r * 0.60, -9);
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillText(SLICES[i].sublabel, r * 0.60, 11);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = "#208b47";
  ctx.lineWidth   = 7;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
  ctx.fillStyle   = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#208b47";
  ctx.lineWidth   = 4;
  ctx.stroke();
}

const KEYFRAMES = `
  @keyframes confettiFall {
    0%   { transform: translateY(-20px) rotate(0deg);    opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateY(105vh) rotate(720deg);  opacity: 0; }
  }
  @keyframes popIn {
    0%   { transform: scale(0.3) translateY(16px); opacity: 0; }
    65%  { transform: scale(1.08); }
    100% { transform: scale(1)    translateY(0);   opacity: 1; }
  }
  @keyframes pulseBig {
    0%, 100% { transform: scale(1); }
    50%      { transform: scale(1.05); }
  }
  @keyframes cardIn {
    0%   { transform: scale(0.88) translateY(24px); opacity: 0; }
    100% { transform: scale(1)    translateY(0);    opacity: 1; }
  }
  @keyframes shimmer {
    0%   { box-shadow: 0 0 0 0   rgba(32,139,71,0.5); }
    70%  { box-shadow: 0 0 0 18px rgba(32,139,71,0);  }
    100% { box-shadow: 0 0 0 0   rgba(32,139,71,0);   }
  }
`;

export default function WheelSection() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [deg,      setDeg]      = useState(0);
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [prize,    setPrize]    = useState<PrizeConfig | null>(null);
  const [alreadySpun, setAlreadySpun] = useState(false);

  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPrize(JSON.parse(raw) as PrizeConfig);
        setAlreadySpun(true);
        setPhase("done");
      }
    } catch {}
  }, []);

  const confetti = useMemo(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left:     Math.random() * 100,
      delay:    Math.random() * 2.5,
      duration: 1.8 + Math.random() * 2,
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w:        5  + Math.random() * 9,
      h:        8  + Math.random() * 12,
      circle:   Math.random() > 0.4,
      rot:      Math.random() * 360,
    }))
  , []);

  const spin = () => {
    if (phase !== "idle") return;

    const types: PrizeType[] = ["10off", "20off", "freeship"];
    const wonType = types[Math.floor(Math.random() * types.length)];

    const candidates = SLICES
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.type === wonType)
      .map(({ i }) => i);
    const target = candidates[Math.floor(Math.random() * candidates.length)];

    const totalDeg = 5 * 360 + (330 - target * SLICE_DEG);
    setDeg(totalDeg);
    setPhase("spinning");

    setTimeout(() => {
      const result = PRIZES[wonType];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch {}
      setPrize(result);
      setPhase("revealing");
      setTimeout(() => setPhase("done"), 3200);
    }, SPIN_MS + 300);
  };

  /* ── DONE: result card (canvas not needed anymore) ── */
  if (phase === "done" && prize) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
        <style>{KEYFRAMES}</style>

        {!alreadySpun && (
          <div style={{ position:"fixed", top:0, left:0, width:"100%", height:"100%", pointerEvents:"none", overflow:"hidden", zIndex:50 }}>
            {confetti.map(p => (
              <div key={p.id} style={{
                position: "absolute",
                left: `${p.left}%`,
                top: "-15px",
                width: `${p.w}px`,
                height: `${p.h}px`,
                backgroundColor: p.color,
                borderRadius: p.circle ? "50%" : "3px",
                transform: `rotate(${p.rot}deg)`,
                animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
              }} />
            ))}
          </div>
        )}

        <section
          className="rounded-3xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-10 text-center shadow-md"
          style={{ animation: "cardIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <div className="mb-4 text-7xl">{prize.emoji}</div>
          <h2 className="mb-3 text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
            {alreadySpun ? "Here's your discount!" : prize.title}
          </h2>
          <p className="mx-auto mb-7 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
            {alreadySpun
              ? `Enjoy organic, non-GMO, premium quality products with ${prize.label} — your exclusive code is waiting below!`
              : prize.description}
          </p>

          <div
            className="mx-auto mb-7 max-w-md rounded-2xl border-2 border-dashed border-green-700 bg-green-50 px-6 py-5 text-center"
            style={{ animation: "shimmer 1.4s ease-out 0.5s 3" }}
          >
            <div className="mb-1 text-xs font-extrabold tracking-[0.18em] text-green-700">✨ YOUR {prize.label} CODE ✨</div>
            <div className="text-3xl font-extrabold tracking-wider text-slate-900">{prize.code}</div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://www.znaturalfoods.com/"         className="rounded-xl bg-green-700 px-6 py-3 font-extrabold text-white hover:bg-green-800">Start shopping →</a>
            <a href="https://www.znaturalfoods.com/specials" className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-extrabold text-slate-700 hover:border-gray-400">See current specials</a>
          </div>

          <button onClick={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} className="mt-6 text-xs text-gray-400 underline hover:text-gray-600">
            Reset wheel
          </button>
        </section>
      </main>
    );
  }

  /* ── IDLE / SPINNING / REVEALING — canvas stays mounted the whole time ── */
  return (
    <main className="mx-auto max-w-3xl px-6 pb-16 pt-12">
      <style>{KEYFRAMES}</style>

      {phase === "idle" && (
        <section className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">Spin to Win!</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-500 md:text-xl md:leading-8">
            Give the wheel a spin and claim your exclusive discount. Every customer wins!
          </p>
        </section>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center">

          {/* Pointer — fixed, wheel spins underneath */}
          <div style={{
            width: 0, height: 0,
            borderLeft:  "18px solid transparent",
            borderRight: "18px solid transparent",
            borderTop:   "34px solid #208b47",
            filter:      "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
            flexShrink:  0,
          }} />

          {/* Canvas stays in DOM across all three phases — transition fires correctly */}
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{
              transform:  `rotate(${deg}deg)`,
              transition: phase === "spinning"
                ? `transform ${SPIN_MS}ms cubic-bezier(0.05, 0.85, 0.08, 1.0)`
                : "none",
              borderRadius: "50%",
              display:      "block",
              maxWidth:     "100%",
              aspectRatio:  "1 / 1",
              boxShadow:    "0 10px 50px rgba(0,0,0,0.2)",
            }}
          />

          {/* Revealing banner — pops in after wheel stops */}
          {phase === "revealing" && prize && (
            <div className="mt-10 text-center" style={{ animation: "popIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <div className="text-7xl mb-4">{prize.emoji}</div>
              <h2 className="text-3xl font-extrabold text-slate-900 md:text-4xl" style={{ animation: "pulseBig 0.9s ease-in-out infinite" }}>
                {prize.title}
              </h2>
              <p className="mt-4 text-gray-400 text-sm">Your discount code is loading…</p>
            </div>
          )}

          {/* Spin button — hidden during revealing */}
          {phase !== "revealing" && (
            <>
              <button
                onClick={spin}
                disabled={phase === "spinning"}
                className="mt-8 rounded-xl bg-green-700 px-10 py-4 text-lg font-extrabold text-white shadow-sm hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phase === "spinning" ? "Spinning..." : "SPIN THE WHEEL 🎯"}
              </button>
            </>
          )}

        </div>
      </section>
    </main>
  );
}
