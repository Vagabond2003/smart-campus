import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Check, LogOut, Monitor, Moon, Sun, Type, UserRound } from "lucide-react";
import { useAuth } from "../app/auth";
import { useMarkNoticesRead, useNotices } from "../api/hooks";
import { student } from "../data/seed";
import type { Notice } from "../data/types";
import { cn } from "../lib/cn";
import { useDisplay, type TextSize, type ThemePref } from "../lib/display";
import { ago } from "../lib/format";
import { Avatar } from "../components/Data";
import { IconButton } from "../components/Button";
import { Menu, MenuItem, MenuItemIndicator, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuSeparator, Popover, Sheet } from "../components/Overlay";
import { useIsDesktop } from "../lib/useMediaQuery";

const THEMES: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Match device", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];
const SIZES: { value: TextSize; label: string; sample: string }[] = [
  { value: "s", label: "Compact text", sample: "text-[0.8125rem]" },
  { value: "m", label: "Default text", sample: "text-[0.9375rem]" },
  { value: "l", label: "Large text", sample: "text-[1.0625rem]" },
];

/** Theme and text size. The text-size control carries over from the incumbent portal. */
export function DisplayMenu({ tone = "default" }: { tone?: "default" | "rail" }) {
  const [open, setOpen] = useState(false);
  const d = useDisplay();
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      label="Display settings"
      trigger={
        <IconButton label="Display: theme and text size" tone={tone} data-tooltip="Theme and text size">
          <Type size={18} strokeWidth={1.75} />
        </IconButton>
      }
    >
      <MenuLabel className="menu-label caps">Theme</MenuLabel>
      <MenuRadioGroup value={d.theme} onValueChange={(v) => d.setTheme(v as ThemePref)}>
        {THEMES.map((t) => (
          <MenuRadioItem key={t.value} value={t.value} className="menu-item" onSelect={(e) => e.preventDefault()}>
            <t.icon size={16} strokeWidth={1.75} />
            <span className="flex-1">{t.label}</span>
            <MenuItemIndicator>
              <Check size={16} strokeWidth={2} className="text-primary" />
            </MenuItemIndicator>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
      <MenuSeparator className="menu-sep" />
      <MenuLabel className="menu-label caps">Text size</MenuLabel>
      <MenuRadioGroup value={d.text} onValueChange={(v) => d.setText(v as TextSize)}>
        {SIZES.map((s) => (
          <MenuRadioItem key={s.value} value={s.value} className="menu-item" onSelect={(e) => e.preventDefault()}>
            <span className={cn("w-4 text-center font-[680] text-ink-2", s.sample)} aria-hidden>
              A
            </span>
            <span className="flex-1">{s.label}</span>
            <MenuItemIndicator>
              <Check size={16} strokeWidth={2} className="text-primary" />
            </MenuItemIndicator>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </Menu>
  );
}

export function ProfileMenu({ onRail }: { onRail?: boolean }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      label="Account"
      trigger={
        <button
          type="button"
          aria-label={`Account: ${student.name}`}
          className={cn(
            "flex h-10 items-center gap-2.5 rounded-full pl-1 pr-1 transition-colors duration-150 ease-out xl:pr-3",
            onRail ? "hover:bg-rail-hover" : "hover:bg-surface-2",
          )}
        >
          <Avatar name={student.name} you size="md" />
          <span className="hidden min-w-0 flex-col text-left leading-tight xl:flex">
            <span className="truncate text-sm font-[620] text-ink">{student.name}</span>
            <span className="num truncate text-2xs text-ink-3">{student.id}</span>
          </span>
        </button>
      }
    >
      <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-2">
        <Avatar name={student.name} you size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-[650] text-ink">{student.name}</p>
          <p className="num text-xs text-ink-3">{student.id}</p>
          <p className="text-xs text-ink-3">
            {student.program} · {student.levelTerm}
          </p>
        </div>
      </div>
      <MenuSeparator className="menu-sep" />
      <MenuItem className="menu-item" onSelect={() => nav("/profile")}>
        <UserRound size={16} strokeWidth={1.75} />
        My Profile
      </MenuItem>
      <MenuItem
        className="menu-item"
        onSelect={() => {
          signOut();
          nav("/login", { replace: true });
        }}
      >
        <LogOut size={16} strokeWidth={1.75} />
        Sign out
      </MenuItem>
    </Menu>
  );
}

const toneDot: Record<Notice["tone"], string> = { info: "bg-primary", caution: "bg-caution-fill", danger: "bg-danger" };

function NoticeList({ onPick }: { onPick: () => void }) {
  const { data } = useNotices();
  const mark = useMarkNoticesRead();
  const nav = useNavigate();
  const unread = data?.filter((n) => !n.read).length ?? 0;
  return (
    <div className="flex max-h-[min(30rem,70dvh)] flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
        <p className="text-sm font-[650] text-ink">{unread ? `${unread} new` : "All caught up"}</p>
        {unread ? (
          <button type="button" className="rounded-sm text-sm font-[560] text-link hover:underline" onClick={() => mark.mutate()}>
            Mark all as read
          </button>
        ) : null}
      </div>
      <ul className="min-h-0 overflow-y-auto px-1.5 pb-1.5">
        {data?.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className="flex w-full gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2"
              onClick={() => {
                onPick();
                nav(n.to);
              }}
            >
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : toneDot[n.tone])} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm", n.read ? "font-[520] text-ink-2" : "font-[630] text-ink")}>{n.title}</span>
                <span className="block text-sm text-ink-2">{n.body}</span>
                <span className="mt-0.5 block text-xs text-ink-3">{ago(n.at)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NoticesButton({ tone = "default" }: { tone?: "default" | "rail" }) {
  const [open, setOpen] = useState(false);
  const { data } = useNotices();
  const desktop = useIsDesktop();
  const unread = data?.filter((n) => !n.read).length ?? 0;
  const trigger = (
    <IconButton label={unread ? `Notifications, ${unread} new` : "Notifications"} tone={tone} data-tooltip="Notifications" onClick={desktop ? undefined : () => setOpen(true)}>
      <Bell size={18} strokeWidth={1.75} />
      {unread ? (
        <span className={cn("num absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber px-1 text-[0.625rem] font-[750] leading-none text-[#121314]", tone === "rail" ? "ring-2 ring-rail" : "ring-2 ring-ground")}>{unread}</span>
      ) : null}
    </IconButton>
  );
  if (!desktop) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen} title="Notifications">
          <NoticeList onPick={() => setOpen(false)} />
        </Sheet>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen} trigger={trigger} label="Notifications" className="w-[24rem]">
      <NoticeList onPick={() => setOpen(false)} />
    </Popover>
  );
}
