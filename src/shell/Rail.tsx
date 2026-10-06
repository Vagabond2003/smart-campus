import { NavLink } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { NAV } from "../app/nav";
import { prefetchRoute } from "../api/hooks";
import { cn } from "../lib/cn";

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <img src="/crest-96.webp" alt="" width={compact ? 30 : 38} height={compact ? 31 : 39} className="no-outline shrink-0" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={cn("font-[720] tracking-[-0.01em] text-rail-ink [font-stretch:92%]", compact ? "text-[1.0625rem]" : "text-[1.1875rem]")}>Smart Campus</span>
        {!compact ? <span className="caps mt-1 text-rail-ink-2">BAUST · Student portal</span> : null}
      </span>
    </span>
  );
}

/** Desktop rail: flag green, grouped modules, an amber "you are here" dot on the active module. */
export function Rail() {
  const qc = useQueryClient();
  return (
    <aside className="sticky top-0 z-30 flex h-dvh w-[var(--rail-w)] flex-col self-start bg-rail text-rail-ink" data-on-rail>
      <div className="flex h-[var(--topbar-h)] shrink-0 items-center px-5">
        <NavLink to="/dashboard" className="rounded-md no-underline" aria-label="Smart Campus, go to Dashboard">
          <Brand />
        </NavLink>
      </div>
      <nav aria-label="Modules" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:var(--rail-line)_transparent]">
        {NAV.map((g) => (
          <div key={g.label} className="mt-5 first:mt-1">
            <p className="caps px-3 pb-1.5 text-rail-ink-2">{g.label}</p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onPointerEnter={() => prefetchRoute(qc, item.to)}
                    onFocus={() => prefetchRoute(qc, item.to)}
                    className={({ isActive }) =>
                      cn(
                        "group flex min-h-10 items-center gap-3 rounded-md px-3 py-1.5 text-[0.875rem] leading-tight no-underline [font-stretch:94%] transition-[background-color,color] duration-150 ease-out",
                        isActive ? "bg-rail-deep font-[630] text-rail-ink" : "font-[500] text-rail-ink/88 hover:bg-rail-hover hover:text-rail-ink",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={18} strokeWidth={1.75} className={cn("shrink-0", isActive ? "text-amber" : "text-rail-ink-2 group-hover:text-rail-ink")} aria-hidden />
                        <span className={cn("min-w-0 flex-1 text-pretty", isActive && "band text-[0.8125rem]")}>{item.label}</span>
                        {isActive ? <span className="size-2 shrink-0 rounded-full bg-amber shadow-[0_0_0_3px_rgb(255_176_0/0.28)]" aria-hidden /> : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-rail-line px-5 py-3.5">
        <p className="sample-mark text-2xs text-rail-ink-2">Concept build · synthetic sample data</p>
      </div>
    </aside>
  );
}
