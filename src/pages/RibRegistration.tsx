import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { Checkbox } from "radix-ui";
import { useRegisterRib, useRib } from "../api/hooks";
import type { RibOfferCourse } from "../data/types";
import { now } from "../lib/clock";
import { cn } from "../lib/cn";
import { credits, fmt, plural, taka, until } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { PageHeader, Panel, Signal } from "../components/Data";
import { Bars, ErrorState, Reveal, SuccessCheck } from "../components/Feedback";
import { Dialog } from "../components/Overlay";
import { useToast } from "../components/Toast";

const TYPES = ["Referred", "Improvement", "Backlog"] as const;

export default function RibRegistration() {
  useTitle("RIB Course Registration");
  const { data, isLoading, isError, refetch } = useRib();
  const register = useRegisterRib();
  const toast = useToast();
  const [picked, setPicked] = useState<string[] | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (data && picked == null) setPicked(data.registered.length ? data.registered : data.courses.filter((c) => c.required).map((c) => c.code));
  }, [data, picked]);

  if (isError) return <ErrorState what="RIB registration" onRetry={() => refetch()} />;
  const chosen = data?.courses.filter((c) => picked?.includes(c.code)) ?? [];
  const fee = chosen.reduce((s, c) => s + c.fee, 0);
  const cr = chosen.reduce((s, c) => s + c.credit, 0);
  const closed = data ? data.deadline < now() : false;
  const registered = !!data?.registered.length;
  const skippedRequired = data?.courses.filter((c) => c.required && !picked?.includes(c.code)) ?? [];

  const toggle = (code: string, on: boolean) => setPicked((p) => (on ? [...(p ?? []), code] : (p ?? []).filter((c) => c !== code)));

  return (
    <>
      <PageHeader title="RIB Course Registration" description="Referred, Improvement and Backlog courses you can sit in the next RIB examination." />
      <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
        {data ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex min-w-0 flex-col gap-5">
              <div className={cn("panel flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 lg:px-5", registered ? "bg-ok-wash/50" : closed ? "" : "bg-caution-wash/45")}>
                {registered ? (
                  <>
                    <Signal tone="ok">Registered</Signal>
                    <span className="text-sm text-ink-2">
                      {plural(data.registered.length, "course")} for {data.exam}
                      {data.submittedAt ? `, submitted ${fmt.long(data.submittedAt)}` : ""}. You can change your choice until {fmt.dayShort(data.deadline)}.
                    </span>
                  </>
                ) : closed ? (
                  <>
                    <Signal tone="neutral">Closed</Signal>
                    <span className="text-sm text-ink-2">Registration for {data.exam} closed on {fmt.long(data.deadline)}.</span>
                  </>
                ) : (
                  <>
                    <Signal tone="caution">Open · closes {until(data.deadline)}</Signal>
                    <span className="text-sm text-ink-2">
                      Register for {data.exam} by {fmt.dayShort(data.deadline)}, {fmt.time(data.deadline)}. The exam is on {fmt.long(data.examDate)}.
                    </span>
                  </>
                )}
              </div>

              <Panel id="offered" title={`Offered for ${data.exam}`}>
                <ul>
                  {data.courses.map((c) => (
                    <CourseChoice key={c.code} c={c} checked={!!picked?.includes(c.code)} disabled={closed} onChange={(on) => toggle(c.code, on)} />
                  ))}
                </ul>
              </Panel>
              {skippedRequired.length ? (
                <p className="rounded-md bg-danger-wash px-4 py-3 text-sm text-danger" role="status">
                  {skippedRequired.map((c) => c.code).join(", ")} stays a backlog course if you don't register it now. The next chance is the RIB exam after next term.
                </p>
              ) : null}
            </div>

            <aside className="flex flex-col gap-5 xl:sticky xl:top-[calc(var(--topbar-h)+1.5rem)] xl:self-start">
              <Panel id="summary" title="Offer summary">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Type</th>
                      <th scope="col" className="n">
                        Offered
                      </th>
                      <th scope="col" className="n">
                        Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TYPES.map((t) => {
                      const list = data.courses.filter((c) => c.regType === t);
                      return (
                        <tr key={t}>
                          <td className={list.length ? "text-ink" : "text-ink-3"}>{t}</td>
                          <td className="n">{list.length}</td>
                          <td className="n">{credits(list.reduce((s, c) => s + c.credit, 0))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="border-t border-line px-4 py-4 lg:px-5">
                  <dl className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-2">Selected</dt>
                      <dd className="num font-[620] text-ink">
                        {plural(chosen.length, "course")} · {credits(cr)} cr
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-2">RIB fee</dt>
                      <dd className="num font-[680] text-ink">{taka(fee)}</dd>
                    </div>
                  </dl>
                  <Button className="mt-4 w-full" disabled={closed || !chosen.length || register.isPending} onClick={() => setConfirm(true)}>
                    {registered ? "Update registration" : `Register ${plural(chosen.length, "course")}`}
                  </Button>
                  <p className="mt-2 text-xs text-ink-3">The fee is added to Bills when you register. Fees here are sample values.</p>
                </div>
              </Panel>
            </aside>
          </div>
        ) : null}
      </Reveal>

      <Dialog
        open={confirm}
        onOpenChange={(o) => {
          setConfirm(o);
          if (!o) setDone(false);
        }}
        title={done ? "Registration received" : `Register for ${data?.exam ?? "RIB exam"}?`}
        description={done ? undefined : "Check your choice. The fee bill is created as soon as you confirm."}
        footer={
          done ? (
            <>
              <Button asChild variant="secondary">
                <Link to="/admit-card">Admit Card</Link>
              </Button>
              <Button asChild>
                <Link to="/bills">Go to Bills</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setConfirm(false)} disabled={register.isPending}>
                Back
              </Button>
              <Button
                disabled={register.isPending}
                onClick={() =>
                  register.mutate(
                    chosen.map((c) => c.code),
                    {
                      onSuccess: () => {
                        setDone(true);
                        toast({ title: "RIB registration received", description: `${taka(fee)} fee added to Bills.` });
                      },
                    },
                  )
                }
              >
                {register.isPending ? "Registering…" : `Confirm · ${taka(fee)}`}
              </Button>
            </>
          )
        }
      >
        {done ? (
          <div className="flex flex-col items-center py-3 text-center" role="status">
            <SuccessCheck show />
            <p className="mt-3 text-[0.9375rem] text-ink">
              {chosen.map((c) => c.code).join(" and ")} {chosen.length === 1 ? "is" : "are"} registered.
            </p>
            <p className="mt-1 text-sm text-ink-2">A {taka(fee)} RIB fee bill is now in Bills. Your admit card is issued closer to the exam.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-line rounded-md border border-line">
            {chosen.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-[700] text-ink [font-stretch:88%]">{c.code}</span> <span className="text-ink-2">{c.regType}</span>
                  <span className="block truncate text-xs text-ink-3">{c.title}</span>
                </span>
                <span className="num shrink-0 text-ink">{taka(c.fee)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between px-3 py-2.5 text-sm font-[680]">
              <span>Total</span>
              <span className="num">{taka(fee)}</span>
            </li>
          </ul>
        )}
      </Dialog>
    </>
  );
}

function CourseChoice({ c, checked, disabled, onChange }: { c: RibOfferCourse; checked: boolean; disabled: boolean; onChange: (on: boolean) => void }) {
  const id = `rib-${c.code.replace(/\s+/g, "-")}`;
  return (
    <li className="border-b border-line last:border-b-0">
      <label htmlFor={id} className={cn("grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 px-4 py-4 transition-colors duration-150 hover:bg-surface-2/50 lg:px-5", disabled && "cursor-not-allowed opacity-60")}>
        <Checkbox.Root
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onChange(v === true)}
          className="mt-0.5 grid size-5 place-items-center rounded-[5px] border-[1.5px] border-line-strong bg-surface transition-colors duration-150 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
        >
          <Checkbox.Indicator>
            <Check size={14} strokeWidth={2.5} className="text-primary-ink" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span className="min-w-0">
          <span className="block text-[0.9375rem] text-ink">
            <span className="font-[700] [font-stretch:88%]">{c.code}</span> <span className="text-ink-2">{c.title}</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
            <Signal tone={c.regType === "Improvement" ? "neutral" : "danger"}>{c.regType}</Signal>
            Previous grade {c.previousGrade} · {c.type} · {credits(c.credit)} credits
          </span>
          <span className="mt-1.5 block text-sm text-ink-2">{c.required ? "Needed to clear this course. Recommended." : "Optional: sit again to try to improve the grade."}</span>
        </span>
        <span className="num text-sm font-[620] text-ink">{taka(c.fee)}</span>
      </label>
    </li>
  );
}
