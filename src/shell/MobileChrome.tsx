import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ellipsis, LogOut, Search } from "lucide-react";
import { NAV, TAB_ITEMS } from "../app/nav";
import { useAuth } from "../app/auth";
import { prefetchRoute } from "../api/hooks";
import { cn } from "../lib/cn";
import { IconButton } from "../components/Button";
import { Sheet } from "../components/Overlay";
import { DepartureBoard } from "./DepartureBoard";
import { Brand } from "./Rail";
import { DisplayMenu, NoticesButton, ProfileMenu } from "./ShellMenus";

/** Phone and tablet header: green signboard band with the departure board directly under it. */
export function MobileHeader({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-rail text-rail-ink pt-safe lg:hidden" data-on-rail>
      <div className="flex h-14 items-center gap-1 pl-3 pr-1.5">
        <NavLink to="/dashboard" className="mr-auto rounded-md no-underline" aria-label="Smart Campus, go to Dashboard">
          <Brand compact />
        </NavLink>
        <IconButton label="Search" tone="rail" onClick={onSearch}>
          <Search size={19} strokeWidth={1.75} />
        </IconButton>
        <NoticesButton tone="rail" />
        <ProfileMenu onRail />
      </div>
      <DepartureBoard className="is-flush" />
    </header>
  );
}

export function TabBar() {
  const [more, setMore] = useState(false);
  const loc = useLocation();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { signOut } = useAuth();
  const inTabs = TAB_ITEMS.some((t) => loc.pathname.startsWith(t.to));

  return (
    <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe lg:hidden">
        <ul className="grid h-[var(--tabbar-h)] grid-cols-5">
          {TAB_ITEMS.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                onTouchStart={() => prefetchRoute(qc, t.to)}
                className={({ isActive }) =>
                  cn(
                    "flex h-full flex-col items-center justify-center gap-1 px-1 text-center text-[0.6875rem] leading-[0.8rem] no-underline transition-colors duration-150",
                    isActive ? "font-[680] text-primary" : "font-[520] text-ink-2",
                  )
                }
              >
                <t.icon size={20} strokeWidth={1.75} aria-hidden />
                <span className="line-clamp-2">{t.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              className={cn("flex h-full w-full flex-col items-center justify-center gap-1 text-[0.6875rem] leading-[0.8rem]", !inTabs ? "font-[680] text-primary" : "font-[520] text-ink-2")}
            >
              <Ellipsis size={20} strokeWidth={1.75} aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onOpenChange={setMore} title="All modules">
        <nav aria-label="All modules">
          {NAV.map((g) => (
            <div key={g.label} className="mt-3 first:mt-0">
              <p className="caps px-3 pb-1 text-ink-3">{g.label}</p>
              <ul>
                {g.items.map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      onClick={() => setMore(false)}
                      className={({ isActive }) =>
                        cn("flex h-12 items-center gap-3 rounded-md px-3 text-[0.9375rem] no-underline", isActive ? "bg-surface-2 font-[650] text-ink" : "font-[520] text-ink hover:bg-surface-2")
                      }
                    >
                      <i.icon size={20} strokeWidth={1.75} className="text-ink-2" aria-hidden />
                      {i.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line px-3 pt-3">
          <div className="flex items-center gap-2 text-sm text-ink-2">
            <DisplayMenu />
            Theme and text size
          </div>
          <button
            type="button"
            className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-[560] text-ink-2 hover:bg-surface-2"
            onClick={() => {
              setMore(false);
              signOut();
              nav("/login", { replace: true });
            }}
          >
            <LogOut size={16} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </Sheet>
    </>
  );
}
