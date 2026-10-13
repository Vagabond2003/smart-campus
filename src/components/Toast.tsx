import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/cn";
import { celebrate as burst, play, type Celebration } from "../lib/feel";
import { tokenMs } from "../lib/presence";

type Tone = "ok" | "info" | "caution";
interface ToastInput {
  title: string;
  description?: string;
  tone?: Tone;
  /** A finished task: the toast carries a stamp and the burst goes off from the button that did it. */
  celebrate?: Celebration;
  /** One way to recover, such as "Try again". */
  action?: { label: string; onClick: () => void };
}
interface ToastItem extends ToastInput {
  id: number;
  tone: Tone;
  open: boolean;
}

const Ctx = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

let next = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, open: false } : x)));
    window.setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), tokenMs("--toast-close", 250));
  }, []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = next++;
      const tone = t.tone ?? "ok";
      setItems((xs) => [...xs.slice(-2), { ...t, id, tone, open: false }]);
      requestAnimationFrame(() => requestAnimationFrame(() => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, open: true } : x)))));
      if (t.celebrate) void burst(t.celebrate);
      else play(tone === "caution" ? "thud" : "pop");
      // a toast with a way to recover stays long enough to use it
      window.setTimeout(() => dismiss(id), t.action ? 9000 : 5200);
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] z-[80] flex flex-col items-center gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (item.open) ref.current?.classList.add("is-open");
    else ref.current?.classList.remove("is-open");
  }, [item.open]);
  const Icon = item.tone === "ok" ? CircleCheck : item.tone === "caution" ? TriangleAlert : Info;
  return (
    <div
      ref={ref}
      role="status"
      className={cn("t-toast pointer-events-auto flex w-full max-w-sm gap-3 rounded-lg bg-board p-3 pr-2 text-board-text shadow-float", item.celebrate ? "items-center" : "items-start")}
      data-on-board
    >
      {item.celebrate ? (
        <span className="stamp" aria-hidden>
          <Check size={18} strokeWidth={2.5} />
        </span>
      ) : (
        <Icon size={18} strokeWidth={1.75} className={cn("mt-0.5 shrink-0", item.tone === "caution" ? "text-amber" : "text-[#6fd6ad]")} />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-[620]">{item.title}</p>
        {item.description ? <p className="mt-0.5 text-sm text-board-text/75">{item.description}</p> : null}
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action?.onClick();
              onClose();
            }}
            className="press mt-2 inline-flex h-8 items-center rounded-md bg-board-2 px-3 text-sm font-[600] text-board-text hover:bg-board-line"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center self-start rounded-md text-board-text/70 hover:bg-board-2 hover:text-board-text">
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}
