import { type ReactNode } from "react";
import { Dialog as RDialog, DropdownMenu, Popover as RPopover } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "../lib/cn";
import { usePresence } from "../lib/presence";
import { IconButton } from "./Button";

/* ─── Dialog: centred, for tasks that need protected focus (payment, search) ─── */

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, width = "32rem", className }: DialogProps) {
  const p = usePresence(open, 150);
  return (
    <RDialog.Root open={p.mounted} onOpenChange={(o) => !o && onOpenChange(false)}>
      <RDialog.Portal>
        <RDialog.Overlay className={cn("scrim z-50", p.className)} />
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
          <RDialog.Content
            className={cn("t-modal flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-xl bg-surface shadow-float outline-none", p.className, className)}
            style={{ maxWidth: width }}
            {...(description ? {} : { "aria-describedby": undefined })}
          >
            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div className="min-w-0">
                <RDialog.Title className="text-lg font-[650] tracking-[-0.01em] text-ink">{title}</RDialog.Title>
                {description ? <RDialog.Description className="mt-1 text-sm text-ink-2">{description}</RDialog.Description> : null}
              </div>
              <RDialog.Close asChild>
                <IconButton label="Close" className="-mr-2 -mt-1">
                  <X size={18} strokeWidth={1.75} />
                </IconButton>
              </RDialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">{children}</div>
            {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
          </RDialog.Content>
        </div>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ─── Sheet: bottom panel on phones (navigation, notices) ─── */

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, title, children }: SheetProps) {
  const p = usePresence(open, 350);
  return (
    <RDialog.Root open={p.mounted} onOpenChange={(o) => !o && onOpenChange(false)}>
      <RDialog.Portal>
        <RDialog.Overlay className="scrim z-50" data-open={p.dataOpen} />
        <RDialog.Content
          className="t-panel-slide fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface shadow-float outline-none pb-safe"
          data-open={p.dataOpen}
          style={{ ["--panel-translate-y" as string]: "48px" }}
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
          <div className="flex items-center justify-between px-4 pb-1 pt-2">
            <RDialog.Title className="text-md font-[650] text-ink">{title}</RDialog.Title>
            <RDialog.Close asChild>
              <IconButton label="Close">
                <X size={18} strokeWidth={1.75} />
              </IconButton>
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ─── Menu: anchored dropdown that grows from its trigger ─── */

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  side?: "bottom" | "top";
  className?: string;
  label?: string;
}

export function Menu({ open, onOpenChange, trigger, children, align = "end", side = "bottom", className, label }: MenuProps) {
  const p = usePresence(open, 150);
  const origin = `${side === "bottom" ? "top" : "bottom"}-${align === "end" ? "right" : "left"}`;
  return (
    <DropdownMenu.Root open={p.mounted} onOpenChange={onOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={8}
          collisionPadding={12}
          aria-label={label}
          className={cn("menu t-dropdown", p.className, className)}
          data-origin={origin}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export const MenuItem = DropdownMenu.Item;
export const MenuLabel = DropdownMenu.Label;
export const MenuSeparator = DropdownMenu.Separator;
export const MenuRadioGroup = DropdownMenu.RadioGroup;
export const MenuRadioItem = DropdownMenu.RadioItem;
export const MenuItemIndicator = DropdownMenu.ItemIndicator;

/* ─── Popover: anchored panel with free content (notices) ─── */

interface PopoverProps extends Omit<MenuProps, "side"> {}

export function Popover({ open, onOpenChange, trigger, children, align = "end", className, label }: PopoverProps) {
  const p = usePresence(open, 150);
  return (
    <RPopover.Root open={p.mounted} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          sideOffset={8}
          collisionPadding={12}
          aria-label={label}
          className={cn("menu t-dropdown p-0", p.className, className)}
          data-origin={align === "end" ? "top-right" : "top-left"}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}
