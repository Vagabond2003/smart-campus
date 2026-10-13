/**
 * Small railway scenes for empty and error states. Each one means something: an empty platform
 * (nothing has arrived yet), a semaphore at stop (not open yet), a lens over a dead-end track
 * (nothing matched), a guard's green flag (all clear), a level crossing (something's blocked),
 * the buffer stop (end of the line). Hover or tap and the scene plays once: a train pulls in and
 * out, the arm lifts, the flag waves. They're decoration: hidden from assistive tech, never
 * focusable, and still under reduced motion.
 */
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { prefersReducedMotion } from "../lib/motion";

export type SceneName = "platform" | "signal" | "search" | "clear" | "fault" | "end";

/** How long each scene's one play lasts (matches the keyframes in springs.css). */
const PLAY_MS: Record<SceneName, number> = { platform: 2700, signal: 2300, search: 0, clear: 1500, fault: 1700, end: 1900 };

export function Scene({ name, className }: { name: SceneName; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const play = () => {
    if (playing || !PLAY_MS[name] || prefersReducedMotion()) return;
    setPlaying(true);
    timer.current = window.setTimeout(() => setPlaying(false), PLAY_MS[name]);
  };

  // the lens follows the pointer across its scene, and drifts home when the pointer leaves
  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (name !== "search" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 110;
    const y = ((e.clientY - r.top) / r.height - 0.45) * 40;
    ref.current.style.setProperty("--mx", `${x.toFixed(1)}px`);
    ref.current.style.setProperty("--my", `${y.toFixed(1)}px`);
  };
  const home = () => {
    ref.current?.style.removeProperty("--mx");
    ref.current?.style.removeProperty("--my");
  };

  return (
    <div
      ref={ref}
      className={cn("scene", className)}
      data-scene={name}
      data-play={playing ? "" : undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && play()}
      onPointerDown={play}
      onPointerMove={track}
      onPointerLeave={home}
      aria-hidden
    >
      <svg viewBox="0 0 200 120" width="200" height="120" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {SCENES[name]}
      </svg>
    </div>
  );
}

/** Rails and sleepers along the bottom; `to` cuts the track short for a buffer stop. */
function Track({ to = 200 }: { to?: number }) {
  const sleepers = [];
  for (let x = 4; x < to - 2; x += 14) sleepers.push(<rect key={x} x={x} y={103} width={5} height={9} rx={1} className="s-sleeper" />);
  return (
    <g>
      {sleepers}
      <line x1={0} y1={105} x2={to} y2={105} className="s-rail" />
      <line x1={0} y1={110} x2={to} y2={110} className="s-rail" />
    </g>
  );
}

function BufferStop({ x }: { x: number }) {
  return (
    <g className="s-buffer">
      <rect x={x} y={84} width={12} height={22} rx={1.5} className="s-fill-ink" />
      <rect x={x - 6} y={87} width={7} height={5} rx={1} className="s-fill-danger" />
      <rect x={x - 6} y={96} width={7} height={5} rx={1} className="s-fill-danger" />
    </g>
  );
}

/** A little locomotive, nose to the right, wheels on the rail at y=105. */
function Loco({ x, className }: { x: number; className?: string }) {
  return (
    <g className={className}>
      <path d={`M${x} 72h40a12 12 0 0 1 12 12v13H${x}z`} className="s-fill-rail" />
      <rect x={x + 4} y={66} width={20} height={8} rx={2} className="s-fill-rail" />
      <rect x={x + 30} y={77} width={11} height={8} rx={1.5} className="s-fill-window" />
      <rect x={x + 6} y={77} width={18} height={8} rx={1.5} className="s-fill-window" />
      <circle cx={x + 10} cy={100} r={5} className="s-fill-ink" />
      <circle cx={x + 40} cy={100} r={5} className="s-fill-ink" />
    </g>
  );
}

const SCENES: Record<SceneName, ReactNode> = {
  platform: (
    <>
      <rect x={0} y={80} width={200} height={14} className="s-fill-quiet" />
      <line x1={0} y1={80} x2={200} y2={80} className="s-line" />
      {/* lamp post with its pool of light */}
      <circle cx={34} cy={44} r={13} className="s-glow" />
      <line x1={34} y1={80} x2={34} y2={36} className="s-stroke" />
      <path d="M27 34h14l-2.5 6h-9z" className="s-fill-ink" />
      {/* bench */}
      <path d="M112 64h32M112 70h32M115 70v10M141 70v10" className="s-stroke" />
      {/* hanging clock */}
      <line x1={170} y1={14} x2={170} y2={26} className="s-stroke" />
      <circle cx={170} cy={36} r={10} className="s-clock" />
      <path d="M170 36v-6M170 36l4 3" className="s-stroke s-hands" />
      <Track />
      {/* the train that pulls in and out when the scene plays */}
      <g className="s-train">
        <rect x={34} y={70} width={62} height={27} rx={4} className="s-fill-rail" />
        <rect x={40} y={76} width={11} height={8} rx={1.5} className="s-fill-window" />
        <rect x={55} y={76} width={11} height={8} rx={1.5} className="s-fill-window" />
        <rect x={70} y={76} width={11} height={8} rx={1.5} className="s-fill-window" />
        <circle cx={44} cy={100} r={5} className="s-fill-ink" />
        <circle cx={86} cy={100} r={5} className="s-fill-ink" />
        <rect x={96} y={86} width={5} height={3} className="s-fill-ink" />
        <Loco x={100} />
      </g>
    </>
  ),
  signal: (
    <>
      <line x1={0} y1={96} x2={200} y2={96} className="s-line" />
      <Track />
      <path d="M90 104h20l-4-9h-12z" className="s-fill-ink" />
      <line x1={100} y1={96} x2={100} y2={18} className="s-post" />
      {/* the arm: horizontal is stop, raised is proceed */}
      <g className="s-arm">
        <rect x={100} y={27} width={46} height={8} rx={1.5} className="s-fill-danger" />
        <rect x={133} y={28.75} width={4} height={4.5} className="s-fill-window" />
      </g>
      <circle cx={100} cy={31} r={3} className="s-fill-ink" />
      {/* the lamp beside the post: red at stop, green once the arm lifts */}
      <rect x={80} y={40} width={13} height={15} rx={3} className="s-fill-ink" />
      <circle cx={86.5} cy={47.5} r={4} className="s-lamp-stop" />
      <circle cx={86.5} cy={47.5} r={4} className="s-lamp-go" />
    </>
  ),
  search: (
    <>
      <line x1={0} y1={96} x2={200} y2={96} className="s-line" />
      <Track to={160} />
      <BufferStop x={166} />
      <g className="s-lens">
        <circle cx={82} cy={54} r={18} className="s-lens-glass" />
        <line x1={95} y1={67} x2={108} y2={80} className="s-lens-handle" />
      </g>
    </>
  ),
  clear: (
    <>
      <rect x={0} y={96} width={200} height={24} className="s-fill-quiet" />
      <line x1={0} y1={96} x2={200} y2={96} className="s-line" />
      <line x1={84} y1={104} x2={84} y2={22} className="s-post" />
      <g className="s-flag">
        <path d="M85 24c16-4 26 6 44 0v30c-18 6-28-4-44 0z" className="s-fill-rail" />
      </g>
      {/* the guard's hand lamp, showing green */}
      <circle cx={140} cy={86} r={11} className="s-glow-go" />
      <path d="M133 77h14v19h-14z" className="s-fill-ink" />
      <circle cx={140} cy={86} r={4.5} className="s-lamp-go is-on" />
      <path d="M136 77c0-5 8-5 8 0" className="s-stroke" />
    </>
  ),
  fault: (
    <>
      <line x1={0} y1={96} x2={200} y2={96} className="s-line" />
      <Track />
      <line x1={56} y1={104} x2={56} y2={24} className="s-post" />
      {/* the crossbuck */}
      <g className="s-crossbuck">
        <rect x={38} y={24} width={36} height={6} rx={1} transform="rotate(32 56 27)" />
        <rect x={38} y={24} width={36} height={6} rx={1} transform="rotate(-32 56 27)" />
      </g>
      {/* the two lamps that take turns */}
      <rect x={40} y={44} width={32} height={5} rx={2} className="s-fill-ink" />
      <circle cx={42} cy={54} r={5.5} className="s-fill-ink" />
      <circle cx={70} cy={54} r={5.5} className="s-fill-ink" />
      <circle cx={42} cy={54} r={3.5} className="s-blink s-blink-a" />
      <circle cx={70} cy={54} r={3.5} className="s-blink s-blink-b" />
      {/* the barrier, down, trying to lift */}
      <g className="s-barrier">
        <rect x={60} y={72} width={124} height={7} rx={2} className="s-fill-window s-barrier-edge" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={66 + i * 20} y={72} width={10} height={7} className="s-fill-danger" />
        ))}
      </g>
      <circle cx={60} cy={75.5} r={4} className="s-fill-ink" />
    </>
  ),
  end: (
    <>
      <line x1={0} y1={96} x2={200} y2={96} className="s-line" />
      <Track to={168} />
      <BufferStop x={172} />
      <Loco x={42} className="s-bump" />
    </>
  ),
};
