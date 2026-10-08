import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn";
import { EASE_OUT, gsap, useGSAP } from "../../lib/motion";
import { boardCells } from "../AuthFrame";
import { GEAR_CENTER } from "./crestArt";
import { IntroCrest } from "./IntroCrest";
import "./intro.css";

export type IntroEnd = "played" | "skipped" | "skipped-key";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** The board announces the service in the same cells the sign-in board uses, so the re-roll never shifts. */
const ANNOUNCE = [
  { label: "Now boarding", value: "Smart Campus" },
  { label: "Platform", value: "1" },
  { label: "Gate", value: "Open" },
  { label: "From", value: "Saidpur" },
];

type Box = { left: number; top: number; width: number; height: number };

const twin = (name: string) => document.querySelector<HTMLElement>(`[data-twin="${name}"]`);

/** Where the sign-in page actually draws its crest inside the square <img> (object-fit: contain). */
function crestBox(img: HTMLElement): Box {
  const r = img.getBoundingClientRect();
  const ratio = 1044 / 1080;
  const width = Math.min(r.width, r.height * ratio);
  const height = width / ratio;
  return { left: r.left + (r.width - width) / 2, top: r.top + (r.height - height) / 2, width, height };
}

/** The move that lays `el` over `to`: centres aligned, scaled by width (both share their proportions). */
function onto(el: Element, to: Box) {
  const r = el.getBoundingClientRect();
  return { x: to.left + to.width / 2 - (r.left + r.width / 2), y: to.top + to.height / 2 - (r.top + r.height / 2), scale: to.width / r.width };
}

/**
 * The arrival: the crest assembles, the board announces the service, then the platform glides onto
 * the sign-in page waiting underneath and every sign lands on its twin there. One timeline.
 */
export function Intro({ onLanded, onDone }: { onLanded: () => void; onDone: (how: IntroEnd) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const skip = useRef<(how: IntroEnd) => void>(() => {});

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current;
      if (!el || !contextSafe) return;
      const q = gsap.utils.selector(el);
      const part = (name: string) => q(`[data-part="${name}"]`);
      const shapes = (name: string) => q(`[data-part="${name}"] path`);
      let ended = false;
      let glider: gsap.core.Timeline | null = null;

      // Match the sign-in page's plate and board to the pixel, so they only have to travel.
      const measure = () => {
        const plate = twin("plate");
        const board = twin("board");
        if (plate) el.style.setProperty("--intro-plate-w", `${plate.getBoundingClientRect().width}px`);
        if (!board) return;
        el.style.setProperty("--intro-board-w", `${board.getBoundingClientRect().width}px`);
        const widths = [...board.querySelectorAll<HTMLElement>(".board-cell")].map((c) => c.getBoundingClientRect().width);
        q(".intro-board .board-cell").forEach((cell, i) => {
          const c = cell as HTMLElement;
          c.style.width = widths[i] ? `${widths[i]}px` : "";
          c.style.display = widths[i] ? "" : "none";
        });
      };

      const roll = (cells: { label: string; value: string }[]) => {
        const t = gsap.timeline();
        q(".intro-board .board-cell").forEach((cell, i) => {
          const c = cells[i];
          if (!c) return;
          t.to(cell.querySelector("[data-label]"), { duration: 0.45, ease: "none", scrambleText: { text: c.label, chars: SCRAMBLE_CHARS, revealDelay: 0.1, speed: 0.9, tweenLength: false } }, i * 0.06);
          t.to(cell.querySelector("[data-value]"), { duration: 0.5 + c.value.length * 0.012, ease: "none", scrambleText: { text: c.value, chars: SCRAMBLE_CHARS, revealDelay: 0.16, speed: 0.9, tweenLength: false } }, i * 0.06 + 0.05);
        });
        return t;
      };

      const end = contextSafe((how: IntroEnd) => {
        if (ended) return;
        ended = true;
        onLanded();
        gsap.to(el, { autoAlpha: 0, duration: how === "played" ? 0.2 : 0.3, ease: "power2.out", onComplete: () => onDone(how) });
      });

      // The glide measures where everything lands at the moment it starts, so any viewport works.
      const glide = contextSafe(() => {
        const panel = twin("panel");
        const crest = twin("crest");
        const title = twin("title");
        const sub = twin("subtitle");
        const plate = twin("plate");
        const board = twin("board");
        const form = twin("form");
        if (!panel || !crest || !title || !sub || !plate || !board || !form) return end("played");
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const p = panel.getBoundingClientRect();
        const sideBySide = p.right < vw - 1;
        const crestMove = onto(q(".intro-crest")[0], crestBox(crest));
        glider = gsap
          .timeline({ defaults: { duration: 0.95, ease: "power3.inOut" }, onComplete: () => end("played") })
          .to(q(".intro-bg"), { clipPath: sideBySide ? `inset(0px ${vw - p.right}px 0px 0px)` : `inset(0px 0px ${Math.max(0, vh - p.bottom)}px 0px)` }, 0)
          .to(q(".intro-crest"), crestMove, 0)
          .to(q(".intro-title-line"), onto(q(".intro-title-line")[0], title.getBoundingClientRect()), 0.03)
          .to(q(".intro-sub"), onto(q(".intro-sub")[0], sub.getBoundingClientRect()), 0.05)
          .to(q(".intro-board"), onto(q(".intro-board")[0], board.getBoundingClientRect()), 0.06)
          .to(q(".intro-board .board-dot, .intro-skip"), { autoAlpha: 0, duration: 0.3, ease: "power1.out" }, 0)
          .add(roll(boardCells()), 0.2)
          .fromTo(form, { autoAlpha: 0, x: sideBySide ? 48 : 0, y: sideBySide ? 0 : 32 }, { autoAlpha: 1, x: 0, y: 0, duration: 0.8, ease: EASE_OUT, clearProps: "opacity,visibility,transform" }, 0.35);
        // The plate never leaves the screen, and never hides the crest's flight.
        const plateMove = onto(q(".intro-plate")[0], plate.getBoundingClientRect());
        if (sideBySide) {
          // The crest heads left, beneath the plate's band; the plate holds, then slides into its slot
          // under the crest once the crest has passed.
          glider.to(q(".intro-plate"), { ...plateMove, duration: 0.5 }, 0.45);
        } else {
          // Stacked, the plate's slot lies between the crest and its corner: the plate settles first and
          // the crest flies over it.
          gsap.set(q(".intro-crest"), { position: "relative", zIndex: 2 });
          glider.to(q(".intro-plate"), { ...plateMove, duration: 0.4 }, 0);
          // Shrink the crest early, so by the time it crosses the plate it covers only the icon end.
          glider.to(q(".intro-crest"), { scale: crestMove.scale, duration: 0.6, ease: EASE_OUT, overwrite: "auto" }, 0);
        }
      });

      // Out of sight until their cue; the green itself is the first frame. The unofficial-concept
      // plate is not part of the show: it is up from the very first frame and never leaves the screen.
      gsap.set([part("shield"), part("ribbon"), part("gear"), shapes("buildings"), part("emblem"), shapes("name"), shapes("motto"), shapes("year"), q(".intro-sub"), q(".intro-board")], { autoAlpha: 0 });
      // Below the mask including its descender allowance (0.25em on a 0.95em line).
      gsap.set(q(".intro-title-line"), { yPercent: 135 });

      const tl = gsap
        .timeline({ paused: true, defaults: { ease: EASE_OUT } })
        .fromTo(part("shield"), { autoAlpha: 0, y: 70, scale: 0.94, transformOrigin: "50% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8 }, 0)
        .fromTo(part("ribbon"), { autoAlpha: 0, scaleX: 0.15, transformOrigin: "50% 50%" }, { autoAlpha: 1, scaleX: 1, duration: 0.8 }, 0.3)
        .fromTo(part("gear"), { autoAlpha: 0, rotation: -150, scale: 0.72, svgOrigin: `${GEAR_CENTER.x} ${GEAR_CENTER.y}` }, { autoAlpha: 1, rotation: 0, scale: 1, duration: 1.15 }, 0.4)
        .fromTo(shapes("buildings"), { autoAlpha: 0, scaleY: 0, transformOrigin: "50% 100%" }, { autoAlpha: 1, scaleY: 1, duration: 0.55, stagger: 0.025 }, 1.0)
        .fromTo(q("[data-wipe]"), { attr: { width: 0 } }, { attr: { width: 340 }, duration: 0.5, ease: "power2.inOut" }, 1.35)
        .fromTo(part("emblem"), { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 1.45)
        .fromTo(shapes("name"), { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07 }, 1.6)
        .fromTo(shapes("motto"), { autoAlpha: 0, scale: 0.4, transformOrigin: "50% 50%" }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.02 }, 1.8)
        .fromTo(shapes("year"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05 }, 2.15)
        .to(q(".intro-title-line"), { yPercent: 0, duration: 0.8 }, 1.9)
        .set(q(".intro-title"), { overflow: "visible" }, 2.75)
        .fromTo(q(".intro-sub"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.2)
        .fromTo(q(".intro-board"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 2.3)
        .add(roll(ANNOUNCE), 2.4)
        .add(glide, 3.55);

      skip.current = contextSafe((how: IntroEnd) => {
        if (ended) return;
        tl.pause();
        glider?.pause();
        const form = twin("form");
        if (form) gsap.fromTo(form, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: EASE_OUT, clearProps: "opacity,visibility,transform" });
        end(how);
      });

      // Start once the face has loaded (its widths decide the board's), but never wait long for it,
      // and only while the tab is in view: a site opened in a background tab plays when it's looked at.
      let started = false;
      let stall = 0;
      const start = contextSafe(() => {
        if (started || ended) return;
        if (document.visibilityState === "hidden") {
          document.addEventListener("visibilitychange", start, { once: true });
          return;
        }
        started = true;
        window.scrollTo(0, 0);
        measure();
        tl.play(0);
        // Whatever goes wrong mid-way (a script error, a throttled tab), nobody is stranded on the platform.
        stall = window.setTimeout(() => end("played"), 9000);
      });
      document.fonts?.ready.then(start);
      const fontWait = window.setTimeout(start, 1200);
      const onResize = () => {
        if (!glider) measure();
      };
      // Development only, for frame-by-frame review: window.__intro.hold(seconds) freezes the build.
      if (import.meta.env.DEV) {
        (window as unknown as { __intro: unknown }).__intro = {
          hold: (at: number) => {
            window.clearTimeout(stall);
            tl.pause(at);
          },
          play: () => tl.play(),
          pauseGlide: () => glider?.pause(),
          resumeGlide: () => glider?.play(),
        };
      }
      window.addEventListener("resize", onResize);
      return () => {
        window.clearTimeout(fontWait);
        window.clearTimeout(stall);
        document.removeEventListener("visibilitychange", start);
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root },
  );

  // Any key skips, except the ones people use to move around or hold as modifiers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || ["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
      if (e.key === "Enter" || e.key === " ") {
        if ((e.target as Element | null)?.closest?.(".intro-skip")) return; // the button handles its own press
      }
      skip.current("skipped-key");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={root} className="intro" onPointerUp={(e) => !(e.target as Element).closest(".intro-skip") && skip.current("skipped")}>
      <div className="intro-bg" />
      <div className="intro-stage" aria-hidden="true">
        <div className="concept-plate intro-plate">
          <TriangleAlert size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
          <p>
            <span className="concept-plate-title">Unofficial concept</span>
            <span className="concept-plate-body">This is not the BAUST portal. Never enter your BAUST password here.</span>
          </p>
        </div>
        <IntroCrest className="intro-crest" />
        <p className="intro-title">
          <span className="intro-title-line">Smart Campus</span>
        </p>
        <p className="intro-sub">Student portal</p>
        <div className="board intro-board" data-on-board>
          {ANNOUNCE.map((c, i) => (
            <span key={c.label} className={cn("board-cell", i === 0 && "is-grow", i === 2 && "is-optional")}>
              {i === 0 ? <span className="board-dot is-live" /> : null}
              <span className="board-label" data-label />
              <span className="board-value" data-value />
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        Smart Campus, an unofficial concept of the BAUST student portal. The sign-in page opens next.
      </p>
      <button type="button" className="intro-skip" onClick={() => skip.current("skipped")}>
        Skip intro
      </button>
    </div>
  );
}
