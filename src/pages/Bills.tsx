import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Banknote, ReceiptText, Smartphone } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { useBills, usePay } from "../api/hooks";
import type { LedgerEntry } from "../api/derive";
import type { Bill } from "../data/types";
import { PAYMENT_ACCOUNT } from "../data/seed";
import { now } from "../lib/clock";
import { cn } from "../lib/cn";
import { fmt, taka, until } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { Money, PageHeader, Signal } from "../components/Data";
import { Bars, ErrorState, Reveal, SuccessCheck } from "../components/Feedback";
import { Disclosure } from "../components/Accordion";
import { Dialog } from "../components/Overlay";
import { Segmented } from "../components/Tabs";
import { useToast } from "../components/Toast";

type Filter = "all" | "bill" | "payment";

export default function Bills() {
  useTitle("Bills");
  const { data, isLoading, isError, refetch } = useBills();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const payParam = params.get("pay");
  const payBill = useMemo(() => {
    if (!data || !payParam) return null;
    const open = data.bills.filter((b) => data.balances[b.id].due > 0);
    return data.bills.find((b) => b.id === payParam) ?? open.find((b) => b.dueDate) ?? open[0] ?? null;
  }, [data, payParam]);

  const closePay = () => {
    params.delete("pay");
    setParams(params, { replace: true });
  };

  if (isError) return <ErrorState what="your bills" onRetry={() => refetch()} />;
  const entries = (data?.ledger ?? []).filter((e) => filter === "all" || e.kind === filter || (filter === "payment" && e.kind === "adjustment")).slice().reverse();
  const due = data?.totals.due ?? 0;
  const nextDue = data?.bills.filter((b) => data.balances[b.id].due > 0 && b.dueDate).sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())[0];

  return (
    <>
      <PageHeader title="Bills" description="Every fee, payment and waiver on your account, with the balance after each." />
      <Reveal loading={isLoading} skeleton={<Bars rows={8} />}>
        {data ? (
          <div className="flex flex-col gap-5">
            {/* One statement line, read like the ledger's own sum: billed − paid − waived = balance due */}
            <section aria-label="Account balance" className={cn("panel flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5", due > 0 ? "border-danger-line" : "")}>
              <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-1.5 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-3">
                {[
                  { k: "Billed", v: data.totals.billed, op: null },
                  { k: "Paid", v: data.totals.paid, op: "−" },
                  { k: "Waived", v: data.totals.adjusted, op: "−" },
                ].map((x) => (
                  <div key={x.k} className="contents sm:flex sm:items-baseline sm:gap-2">
                    {x.op ? (
                      <span aria-hidden className="hidden text-lg text-ink-3 sm:inline">
                        {x.op}
                      </span>
                    ) : null}
                    <dt className="text-sm text-ink-2">{x.k}</dt>
                    <dd className="text-right sm:text-left">
                      <Money value={x.v} className="text-lg font-[660] text-ink" />
                    </dd>
                  </div>
                ))}
                <div className="contents sm:flex sm:items-baseline sm:gap-2">
                  <span aria-hidden className="hidden text-lg text-ink-3 sm:inline">
                    =
                  </span>
                  <dt className="border-t border-line pt-1.5 text-sm font-[640] text-ink sm:border-0 sm:pt-0">Balance due</dt>
                  <dd className="border-t border-line pt-1.5 text-right sm:border-0 sm:pt-0 sm:text-left">
                    <Money value={due} className={cn("text-2xl font-[740]", due > 0 ? "text-danger" : "text-ok")} />
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center gap-3">
                {due > 0 && nextDue?.dueDate ? (
                  <span className="text-sm text-ink-2">
                    Pay by {fmt.dayShort(nextDue.dueDate)} · <span className="font-[620] text-ink">{until(nextDue.dueDate)}</span>
                  </span>
                ) : null}
                {due > 0 ? <Button onClick={() => setParams({ pay: nextDue?.id ?? "1" })}>Pay {taka(due)}</Button> : <Signal tone="ok">Settled</Signal>}
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="band text-md text-ink">Statement</h2>
              <Segmented
                label="Show"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "Everything" },
                  { value: "bill", label: "Bills" },
                  { value: "payment", label: "Payments" },
                ]}
              />
            </div>

            <div className="panel overflow-hidden">
              <div className="hidden grid-cols-[6.5rem_minmax(0,1fr)_7rem_7rem_7rem_8rem_2rem] gap-3 border-b border-line bg-surface-2 px-5 py-2.5 lg:grid" aria-hidden>
                {["Date", "Description", "Fee", "Paid", "Adjusted", "Balance", ""].map((h, i) => (
                  <span key={i} className={cn("caps text-ink-2", i >= 2 && i <= 5 && "text-right")}>
                    {h}
                  </span>
                ))}
              </div>
              <ul aria-label="Statement, newest first">
                {entries.map((e) => (
                  <li key={e.id} className="border-b border-line last:border-b-0">
                    {e.kind === "bill" ? <BillRow entry={e} bill={data.bills.find((b) => b.id === e.billId)!} balance={data.balances[e.billId]} payments={data.payments.filter((p) => p.billId === e.billId)} onPay={() => setParams({ pay: e.billId })} /> : <PlainRow entry={e} />}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-ink-3">Payments go to {PAYMENT_ACCOUNT}. All amounts are synthetic sample data.</p>
          </div>
        ) : null}
      </Reveal>

      <PayDialog open={!!payParam && !!data} bill={payBill} due={payBill && data ? data.balances[payBill.id].due : 0} onClose={closePay} />
    </>
  );
}

const cols = "lg:grid-cols-[6.5rem_minmax(0,1fr)_7rem_7rem_7rem_8rem_2rem]";

function Amount({ v, label }: { v: number; label: string }) {
  return (
    <span className={cn("justify-between gap-2 text-sm lg:block lg:text-right", v ? "flex" : "hidden lg:block")}>
      <span className="text-ink-3 lg:sr-only">{label}</span>
      {v ? <Money value={v} className="text-ink" /> : <span className="text-ink-3">—</span>}
    </span>
  );
}

function PlainRow({ entry: e }: { entry: LedgerEntry }) {
  return (
    <div className={cn("grid grid-cols-1 gap-x-3 gap-y-1.5 px-4 py-3 lg:items-center lg:px-5", cols)}>
      <span className="num text-sm text-ink-2">{fmt.long(e.date)}</span>
      <span className="min-w-0 text-sm text-ink">
        <span className="mr-2 align-middle">{e.kind === "payment" ? <Signal tone="ok">Payment</Signal> : <Signal tone="neutral">Adjustment</Signal>}</span>
        <span className="font-[600]">{e.description}</span>
        <span className="num block truncate text-xs text-ink-3">{e.detail}</span>
      </span>
      <Amount v={e.fee} label="Fee" />
      <Amount v={e.paid} label="Paid" />
      <Amount v={e.adjusted} label="Adjusted" />
      <span className="flex justify-between gap-2 text-sm lg:block lg:text-right">
        <span className="text-ink-3 lg:sr-only">Balance after</span>
        <Money value={e.balance} className="font-[640] text-ink" />
      </span>
      <span className="lg:text-right">
        {e.kind === "payment" ? (
          <Link to={`/bills/receipts/${e.id}`} className="inline-grid size-8 place-items-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink max-lg:inline-flex max-lg:w-auto max-lg:gap-1.5 max-lg:text-sm max-lg:font-[560] max-lg:text-link" aria-label="View receipt">
            <ReceiptText size={16} strokeWidth={1.75} aria-hidden />
            <span className="lg:hidden">Receipt</span>
          </Link>
        ) : null}
      </span>
    </div>
  );
}

function BillRow({ entry: e, bill, balance, payments, onPay }: { entry: LedgerEntry; bill: Bill; balance: { paid: number; adjusted: number; payable: number; due: number }; payments: { id: string; date: Date; amount: number; provider?: string; method: string }[]; onPay: () => void }) {
  const open = balance.due > 0;
  return (
    <Disclosure
      layout="custom"
      className="relative"
      headClassName={cn("grid grid-cols-1 gap-x-3 gap-y-1.5 px-4 py-3 pr-11 hover:bg-surface-2/50 lg:items-center lg:px-5", cols)}
      summary={
        <span className="contents">
          <span className="num text-sm text-ink-2">{fmt.long(e.date)}</span>
          <span className="min-w-0 text-sm text-ink">
            <span className="mr-2 align-middle">{open ? <Signal tone={bill.dueDate && bill.dueDate < now() ? "danger" : "caution"}>Due {taka(balance.due)}</Signal> : <Signal tone="neutral">Bill</Signal>}</span>
            <span className="font-[600]">{bill.title}</span>
            <span className="num block text-xs text-ink-3">{e.detail}</span>
          </span>
          <Amount v={e.fee} label="Fee" />
          <Amount v={e.paid} label="Paid" />
          <Amount v={e.adjusted} label="Adjusted" />
          <span className="flex justify-between gap-2 text-sm lg:block lg:text-right">
            <span className="text-ink-3 lg:sr-only">Balance after</span>
            <Money value={e.balance} className="font-[640] text-ink" />
          </span>
        </span>
      }
    >
      <div className="grid gap-5 border-t border-dashed border-line bg-surface-2/40 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-5 lg:pl-[8.5rem]">
        <div>
          <h4 className="text-sm font-[640] text-ink">Fee breakdown</h4>
          <dl className="mt-2 flex flex-col">
            {bill.lines.map((l) => (
              <div key={l.name} className="flex justify-between border-b border-line py-1.5 text-sm last:border-b-0">
                <dt className="text-ink-2">{l.name}</dt>
                <dd>
                  <Money value={l.amount} className="text-ink" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h4 className="text-sm font-[640] text-ink">Against this bill</h4>
          <dl className="mt-2 flex flex-col text-sm">
            {payments.map((p) => (
              <div key={p.id} className="flex justify-between gap-3 border-b border-line py-1.5">
                <dt className="text-ink-2">
                  Paid {fmt.short(p.date)} · {p.provider ?? p.method}{" "}
                  <Link to={`/bills/receipts/${p.id}`} className="link ml-1">
                    Receipt
                  </Link>
                </dt>
                <dd>
                  <Money value={-p.amount} className="text-ink" />
                </dd>
              </div>
            ))}
            {balance.adjusted ? (
              <div className="flex justify-between border-b border-line py-1.5">
                <dt className="text-ink-2">Waiver</dt>
                <dd>
                  <Money value={-balance.adjusted} className="text-ink" />
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between py-1.5 font-[650]">
              <dt className="text-ink">Remaining</dt>
              <dd>
                <Money value={balance.due} className={open ? "text-danger" : "text-ink"} />
              </dd>
            </div>
          </dl>
          {open ? (
            <Button size="sm" className="mt-3" onClick={onPay}>
              Pay {taka(balance.due)}
            </Button>
          ) : null}
        </div>
      </div>
    </Disclosure>
  );
}

const METHODS = [
  { value: "bKash", label: "bKash", icon: Smartphone },
  { value: "Nagad", label: "Nagad", icon: Smartphone },
  { value: "Rocket", label: "Rocket", icon: Smartphone },
  { value: "Bank card", label: "Bank card", icon: Banknote },
];

function PayDialog({ open, bill, due, onClose }: { open: boolean; bill: Bill | null; due: number; onClose: () => void }) {
  const [method, setMethod] = useState("bKash");
  const pay = usePay();
  const toast = useToast();
  const [receiptId, setReceiptId] = useState<string | null>(null);
  // Snapshot the bill and amount when the dialog opens: paying changes the live balance underneath it.
  const [snap, setSnap] = useState<{ bill: Bill; due: number } | null>(null);

  useEffect(() => {
    if (open && bill) {
      setSnap({ bill, due });
      setReceiptId(null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const b = snap?.bill ?? null;
  const amount = snap?.due ?? 0;
  const settled = !receiptId && amount <= 0;

  return (
    <Dialog
      open={open && !!snap}
      onOpenChange={(o) => !o && onClose()}
      title={receiptId ? "Payment received" : settled ? "Nothing to pay" : "Pay dues"}
      description={receiptId ? undefined : b ? `${b.title} · bill ${b.number}` : undefined}
      footer={
        settled ? (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : receiptId ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button asChild>
              <Link to={`/bills/receipts/${receiptId}`}>View receipt</Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={pay.isPending}>
              Cancel
            </Button>
            <Button
              disabled={pay.isPending || !b}
              onClick={() =>
                b &&
                pay.mutate(
                  { billId: b.id, amount, provider: method },
                  {
                    onSuccess: (p) => {
                      setReceiptId(p.id);
                      toast({ title: "Payment received", description: `${taka(amount)} by ${method}. Receipt ready.` });
                    },
                  },
                )
              }
            >
              {pay.isPending ? "Processing…" : `Pay ${taka(amount)}`}
            </Button>
          </>
        )
      }
    >
      {settled ? (
        <p className="text-[0.9375rem] text-ink-2">This bill is already settled. There is nothing left to pay on it.</p>
      ) : receiptId ? (
        <div className="flex flex-col items-center py-4 text-center" role="status">
          <SuccessCheck show className="size-16 [&_svg]:size-16" />
          <p className="mt-4 text-[0.9375rem] text-ink">
            <span className="font-[680]">{taka(amount)}</span> paid by {method}.
          </p>
          <p className="mt-1 text-sm text-ink-2">Your statement and balance are updated.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between rounded-md bg-surface-2 px-4 py-3">
            <span className="text-sm text-ink-2">Amount</span>
            <Money value={amount} className="text-xl font-[720] text-ink" />
          </div>
          <fieldset>
            <legend className="field-label">Pay with</legend>
            <RadioGroup.Root value={method} onValueChange={setMethod} className="grid grid-cols-2 gap-2" aria-label="Payment method">
              {METHODS.map((m) => (
                <RadioGroup.Item
                  key={m.value}
                  value={m.value}
                  className="flex h-12 items-center gap-2.5 rounded-md border border-line-strong bg-surface px-3 text-left text-sm font-[580] text-ink transition-[border-color,box-shadow] duration-150 hover:border-ink-3 data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_0_1px_var(--primary)]"
                >
                  <m.icon size={18} strokeWidth={1.75} className="text-ink-2" aria-hidden />
                  <span className="flex-1">{m.label}</span>
                  <span className="grid size-4 place-items-center rounded-full border border-line-strong" aria-hidden>
                    <RadioGroup.Indicator className="size-2 rounded-full bg-primary" />
                  </span>
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          </fieldset>
          <p className="rounded-md bg-caution-wash px-3 py-2.5 text-sm text-caution">Demo payment: no money moves and no provider is contacted. It only updates this sample statement.</p>
        </div>
      )}
    </Dialog>
  );
}
