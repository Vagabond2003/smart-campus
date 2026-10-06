import { Suspense, useEffect, useState } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { Search } from "lucide-react";
import { useStoreSync } from "../api/hooks";
import { IconButton } from "../components/Button";
import { PageSkeleton } from "../components/Feedback";
import { TipGroup } from "../components/Tooltip";
import { CommandMenu } from "./CommandMenu";
import { DepartureBoard } from "./DepartureBoard";
import { MobileHeader, TabBar } from "./MobileChrome";
import { Rail } from "./Rail";
import { DisplayMenu, NoticesButton, ProfileMenu } from "./ShellMenus";
import { useIsDesktop } from "../lib/useMediaQuery";

export function AppShell() {
  const [search, setSearch] = useState(false);
  const desktop = useIsDesktop();
  useStoreSync();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--rail-w)_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,var(--rail)_var(--rail-w),transparent_var(--rail-w))]">
      <a href="#main" className="sr-only z-[90] rounded-md bg-board px-4 py-2 text-board-text focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      {desktop ? <Rail /> : <MobileHeader onSearch={() => setSearch(true)} />}

      <div className="min-w-0">
        {desktop ? (
          <header className="sticky top-0 z-30 flex h-[var(--topbar-h)] items-center gap-3 border-b border-line bg-ground px-6 xl:px-8">
            <DepartureBoard className="min-w-0 flex-1" />
            <TipGroup className="items-center gap-0.5">
              <IconButton label="Search modules and courses (Ctrl K)" data-tooltip="Search · Ctrl K" onClick={() => setSearch(true)}>
                <Search size={18} strokeWidth={1.75} />
              </IconButton>
              <NoticesButton />
              <DisplayMenu />
            </TipGroup>
            <ProfileMenu />
          </header>
        ) : null}

        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[84rem] px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+2rem)] pt-5 outline-none sm:px-6 lg:px-8 lg:pb-16 lg:pt-7 xl:px-10">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {desktop ? null : <TabBar />}
      <CommandMenu open={search} onOpenChange={setSearch} />
      <ScrollRestoration />
    </div>
  );
}
