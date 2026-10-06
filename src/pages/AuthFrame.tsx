import { type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { calendar as C, now } from "../lib/clock";
import { cn } from "../lib/cn";
import { fmt, until } from "../lib/format";

function StaticBoard() {
  const cells = [
    { label: "Today", value: fmt.dayShort(now()) },
    { label: "Term", value: C.current.label },
    { label: "Week", value: `${C.week} of ${C.weeks}`, optional: true },
    { label: "Mid term", value: until(C.midTermStart) },
  ];
  return (
    <div className="board w-full max-w-xl" data-on-board aria-label={`Today ${fmt.full(now())}. ${C.current.label}, week ${C.week} of ${C.weeks}. Mid term ${until(C.midTermStart)}.`} role="img">
      {cells.map((c, i) => (
        <span key={c.label} className={cn("board-cell", i === 0 && "is-grow", c.optional && "is-optional")} aria-hidden>
          <span className="board-label">{c.label}</span>
          <span className="board-value">{c.value}</span>
        </span>
      ))}
    </div>
  );
}

/** Sign-in frame: the station-board identity on flag green, the task on platform white. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-ground lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      <section className="relative flex flex-col justify-between gap-10 bg-rail px-5 pb-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] text-rail-ink sm:px-10 lg:px-14 lg:py-12" data-on-rail aria-label="Bangladesh Army University of Science and Technology">
        <div>
          <div className="flex items-center gap-4">
            <img src="/crest-192.webp" alt="BAUST crest" width={56} height={58} className="no-outline size-12 shrink-0 object-contain lg:size-14" />
            <div className="min-w-0 leading-tight">
              <p className="text-[0.9375rem] font-[640]">Bangladesh Army University of Science and Technology</p>
              <p className="text-sm text-rail-ink-2">Saidpur Cantonment, Nilphamari</p>
            </div>
          </div>
          {/* Always visible, at every size: this site borrows BAUST's name and crest but isn't BAUST's. */}
          <div role="note" className="concept-plate mt-5">
            <TriangleAlert size={16} strokeWidth={2} className="mt-px shrink-0" aria-hidden />
            <p>
              <span className="concept-plate-title">Unofficial concept</span>
              <span className="concept-plate-body">This is not the BAUST portal. Never enter your BAUST password here.</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:gap-8">
          <div>
            <p className="text-[2.75rem] font-[760] leading-[0.95] tracking-[-0.035em] [font-stretch:86%] sm:text-[3.5rem] lg:text-[4.75rem]">Smart Campus</p>
            <p className="mt-3 text-lg text-rail-ink-2 lg:text-xl">Student portal</p>
          </div>
          <StaticBoard />
        </div>

        <div className="hidden items-end justify-between gap-6 lg:flex">
          <p className="caps text-rail-ink-2">Discipline · Knowledge · Morality</p>
          <p className="sample-mark text-2xs text-rail-ink-2">Synthetic sample data · not affiliated with BAUST</p>
        </div>
      </section>

      <section className="flex items-start justify-center px-5 py-10 sm:px-10 lg:items-center lg:py-12">
        <div className="w-full max-w-[25rem]">{children}</div>
      </section>
    </div>
  );
}
