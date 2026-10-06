import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Dialog as RDialog } from "radix-ui";
import { BookOpen, CornerDownLeft, FileClock, IdCard, Moon, Printer, ReceiptText, Search, Sun } from "lucide-react";
import { NAV_ITEMS } from "../app/nav";
import { offerings } from "../data/seed";
import { cn } from "../lib/cn";
import { useDisplay } from "../lib/display";
import { usePresence } from "../lib/presence";

interface Cmd {
  id: string;
  group: "Go to" | "Courses" | "Actions";
  label: string;
  hint?: string;
  keywords?: string;
  icon: typeof Search;
  run: () => void;
}

/** ⌘K / Ctrl+K: jump to any module, course or common action. */
export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate();
  const display = useDisplay();
  const p = usePresence(open, 150);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const go = (to: string) => () => {
    onOpenChange(false);
    nav(to);
  };

  const all: Cmd[] = useMemo(
    () => [
      ...NAV_ITEMS.map((n) => ({ id: n.to, group: "Go to" as const, label: n.label, keywords: n.keywords, icon: n.icon, run: go(n.to) })),
      ...offerings.map((o) => ({ id: o.slug, group: "Courses" as const, label: `${o.code} ${o.title}`, hint: o.type, keywords: "course", icon: BookOpen, run: go(`/courses/${o.slug}`) })),
      { id: "pay", group: "Actions" as const, label: "Pay dues", keywords: "bill fee bkash nagad payment", icon: ReceiptText, run: go("/bills?pay=1") },
      { id: "rib", group: "Actions" as const, label: "Register RIB courses", keywords: "backlog referred improvement", icon: FileClock, run: go("/registration/rib") },
      { id: "admit", group: "Actions" as const, label: "Download admit card", keywords: "print exam", icon: IdCard, run: go("/admit-card") },
      { id: "print", group: "Actions" as const, label: "Print class routine", keywords: "export pdf timetable", icon: Printer, run: go("/routine?print=1") },
      {
        id: "theme",
        group: "Actions" as const,
        label: display.resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        keywords: "theme dark light night",
        icon: display.resolvedTheme === "dark" ? Sun : Moon,
        run: () => {
          display.setTheme(display.resolvedTheme === "dark" ? "light" : "dark");
          onOpenChange(false);
        },
      },
    ],
    [display.resolvedTheme], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((c) => `${c.label} ${c.keywords ?? ""} ${c.hint ?? ""}`.toLowerCase().includes(s));
  }, [q, all]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const groups = ["Go to", "Courses", "Actions"] as const;
  let flatIndex = -1;

  return (
    <RDialog.Root open={p.mounted} onOpenChange={(o) => !o && onOpenChange(false)}>
      <RDialog.Portal>
        <RDialog.Overlay className={cn("scrim z-50", p.className)} />
        <div className="pointer-events-none fixed inset-0 z-50 flex justify-center px-3 pt-[12vh]">
          <RDialog.Content className={cn("t-modal flex max-h-[70dvh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-surface shadow-float outline-none", p.className)} aria-describedby={undefined}>
            <RDialog.Title className="sr-only">Search Smart Campus</RDialog.Title>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search modules, courses and actions"
                aria-label="Search modules, courses and actions"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
                className="h-14 min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none"
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(results.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(0, a - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    results[active]?.run();
                  }
                }}
              />
              <kbd className="hidden rounded-sm border border-line px-1.5 py-0.5 text-2xs text-ink-3 sm:block">Esc</kbd>
            </div>
            <ul ref={listRef} id="cmd-list" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-1.5">
              {results.length === 0 ? <li className="px-3 py-8 text-center text-sm text-ink-2">No module, course or action matches "{q}".</li> : null}
              {groups.map((g) => {
                const items = results.filter((r) => r.group === g);
                if (!items.length) return null;
                return (
                  <li key={g} role="presentation">
                    <p className="caps px-2.5 pb-1 pt-2.5 text-ink-3">{g}</p>
                    <ul role="presentation">
                      {items.map((c) => {
                        flatIndex += 1;
                        const i = flatIndex;
                        return (
                          <li
                            key={c.id}
                            id={`cmd-${c.id}`}
                            role="option"
                            aria-selected={i === active}
                            data-index={i}
                            className={cn("menu-item cursor-pointer", i === active && "bg-surface-2")}
                            onPointerMove={() => setActive(i)}
                            onClick={() => c.run()}
                          >
                            <c.icon size={16} strokeWidth={1.75} />
                            <span className="min-w-0 flex-1 truncate">{c.label}</span>
                            {c.hint ? <span className="text-xs text-ink-3">{c.hint}</span> : null}
                            {i === active ? <CornerDownLeft size={14} strokeWidth={1.75} className="text-ink-3" aria-hidden /> : null}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </RDialog.Content>
        </div>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
