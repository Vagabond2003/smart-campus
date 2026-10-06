import { type ReactNode } from "react";
import { cn } from "../lib/cn";

/** Letterhead for official documents (admit card, receipt). Paper in both themes, watermarked SAMPLE. */
export function DocHead({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-start gap-4 border-b-2 border-[#006a4e] pb-4">
      <img src="/crest-192.webp" alt="BAUST crest" width={64} height={66} className="no-outline size-14 shrink-0 object-contain sm:size-16" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.9375rem] font-[700] leading-tight text-[var(--doc-ink)] sm:text-[1.0625rem]">Bangladesh Army University of Science and Technology</p>
        <p className="text-xs text-[var(--doc-ink-2)] sm:text-sm">Saidpur Cantonment, Nilphamari</p>
        <p className="mt-2 inline-block rounded-sm bg-[#006a4e] px-2 py-0.5 text-xs font-[700] uppercase tracking-[0.08em] text-white [font-stretch:80%]">{title}</p>
        {subtitle ? <p className="mt-1 text-sm font-[600] text-[var(--doc-ink)]">{subtitle}</p> : null}
      </div>
      {right}
    </header>
  );
}

export function DocFields({ items, className }: { items: { k: string; v: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2", className)}>
      {items.map((it) => (
        <div key={it.k} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2 text-sm">
          <dt className="text-[var(--doc-ink-2)]">{it.k}</dt>
          <dd className="font-[600] text-[var(--doc-ink)]">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** `colClass` lets a column step aside on narrow screens (print always shows every column). */
export function DocTable({ head, rows, foot, colClass = [] }: { head: ReactNode[]; rows: ReactNode[][]; foot?: ReactNode[]; colClass?: (string | undefined)[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm text-[var(--doc-ink)]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={cn("border border-[var(--doc-line)] bg-[#eef2ef] px-2.5 py-1.5 text-left text-xs font-[700] uppercase tracking-[0.05em] [font-stretch:82%] print:table-cell", colClass[i])}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={cn("border border-[var(--doc-line)] px-2.5 py-1.5 align-top print:table-cell", colClass[j])}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot ? (
          <tfoot>
            <tr>
              {foot.map((c, i) => (
                <td key={i} className={cn("border border-[var(--doc-line)] px-2.5 py-1.5 font-[700] print:table-cell", colClass[i])}>
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

/** Room seat plan: rows × columns facing the board, the student's seat in amber. */
export function SeatMap({ rows, cols, seat, room }: { rows: number; cols: number; seat: { row: number; col: number }; room: string }) {
  return (
    <figure className="max-w-md">
      <div className="mb-3 rounded-sm bg-board px-3 py-1.5 text-center" data-on-board>
        <span className="caps text-board-text">Front · board and invigilator</span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `1.5rem repeat(${cols}, minmax(0,1fr))` }} role="img" aria-label={`${room}: ${rows} rows of ${cols} seats. Your seat is row ${seat.row}, seat ${seat.col}.`}>
        <span aria-hidden />
        {Array.from({ length: cols }, (_, c) => (
          <span key={`h${c}`} className={cn("num text-center text-2xs", c + 1 === seat.col ? "font-[750] text-ink" : "text-ink-3")} aria-hidden>
            {c + 1}
          </span>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <SeatRow key={r} r={r + 1} cols={cols} seat={seat} />
        ))}
      </div>
      <figcaption className="mt-3 flex items-center gap-2 text-sm text-ink-2">
        <span className="inline-block size-3 rounded-[3px] bg-amber" aria-hidden />
        Your seat: <span className="font-[650] text-ink">row {seat.row}, seat {seat.col}</span>
      </figcaption>
    </figure>
  );
}

function SeatRow({ r, cols, seat }: { r: number; cols: number; seat: { row: number; col: number } }) {
  return (
    <>
      <span className={cn("num grid place-items-center text-2xs", r === seat.row ? "font-[750] text-ink" : "text-ink-3")} aria-hidden>
        {r}
      </span>
      {Array.from({ length: cols }, (_, c) => {
        const you = r === seat.row && c + 1 === seat.col;
        return (
          <span key={c} className={cn("seat", you && "is-you")} aria-hidden>
            {you ? "You" : ""}
          </span>
        );
      })}
    </>
  );
}
