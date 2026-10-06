/* oxlint-disable react/jsx-key -- DocTable cells are passed as data arrays; DocTable keys every row and cell it renders. */
import { Link, useParams } from "react-router";
import { Printer, ReceiptText } from "lucide-react";
import { useBills } from "../api/hooks";
import { student } from "../data/seed";
import { fmt, taka } from "../lib/format";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { PageHeader } from "../components/Data";
import { Bars, EmptyState, ErrorState, Reveal } from "../components/Feedback";
import { DocFields, DocHead, DocTable } from "../components/Docs";

export default function Receipt() {
  useTitle("Payment receipt");
  const { id = "" } = useParams();
  const { data, isLoading, isError, refetch } = useBills();
  if (isError) return <ErrorState what="the receipt" onRetry={() => refetch()} />;
  const p = data?.payments.find((x) => x.id === id);
  const bill = p ? data?.bills.find((b) => b.id === p.billId) : undefined;

  // Balance on this bill just before and after this payment
  const before = p && bill && data ? bill.amount - data.payments.filter((x) => x.billId === bill.id && x.date < p.date).reduce((s, x) => s + x.amount, 0) - data.adjustments.filter((a) => a.billId === bill.id && a.date < p.date).reduce((s, a) => s + a.amount, 0) : 0;
  const after = p ? before - p.amount : 0;
  const adjustedBefore = p && bill && data ? data.adjustments.filter((a) => a.billId === bill.id && a.date < p.date).reduce((s, a) => s + a.amount, 0) : 0;

  return (
    <>
      <div className="no-print">
        <PageHeader
          crumbs={[{ label: "Bills", to: "/bills" }, { label: "Receipt" }]}
          title="Payment receipt"
          actions={
            p ? (
              <Button variant="secondary" icon={<Printer size={16} strokeWidth={1.75} />} onClick={() => window.print()}>
                Print or save PDF
              </Button>
            ) : null
          }
        />
      </div>
      <Reveal loading={isLoading} skeleton={<Bars rows={8} />}>
        {p && bill ? (
          <article className="doc doc-print-area mx-auto max-w-3xl p-5 sm:p-8" aria-label="Payment receipt document">
            <DocHead
              title="Payment receipt"
              subtitle="Accounts Office"
              right={
                <div className="hidden text-right text-xs text-[var(--doc-ink-2)] sm:block">
                  <p>Receipt no.</p>
                  <p className="num text-sm font-[700] text-[var(--doc-ink)]">{p.id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)}</p>
                </div>
              }
            />
            <DocFields
              className="mt-5"
              items={[
                { k: "Student", v: student.name },
                { k: "Student ID", v: <span className="num">{student.id}</span> },
                { k: "Program", v: student.program },
                { k: "Payment date", v: <span className="num">{fmt.numeric(p.date)}</span> },
                { k: "Method", v: `${p.method}${p.provider ? ` (${p.provider})` : ""}` },
                { k: "Transaction ref.", v: <span className="num">{p.reference ?? "N/A"}</span> },
              ]}
            />
            <div className="mt-6">
              <DocTable
                head={["Bill", "Bill date", <span className="block text-right">Amount</span>]}
                rows={[
                  [
                    <span>
                      {bill.title}
                      <span className="num block text-xs text-[var(--doc-ink-2)]">No. {bill.number}</span>
                    </span>,
                    <span className="num">{fmt.numeric(bill.date)}</span>,
                    <span className="num block text-right">{taka(bill.amount, { decimals: true })}</span>,
                  ],
                ]}
              />
              <dl className="ml-auto mt-3 w-full max-w-xs text-sm text-[var(--doc-ink)]">
                {[
                  { k: "Waiver applied", v: -adjustedBefore },
                  { k: "Due before payment", v: before },
                  { k: "This payment", v: -p.amount },
                ].map((r) => (
                  <div key={r.k} className="flex justify-between border-b border-[var(--doc-line)] py-1.5">
                    <dt className="text-[var(--doc-ink-2)]">{r.k}</dt>
                    <dd className="num">{taka(r.v, { decimals: true })}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-1.5 font-[700]">
                  <dt>Balance after payment</dt>
                  <dd className="num">{taka(after, { decimals: true })}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-[var(--doc-line)] pt-4">
              <p className={after <= 0 ? "font-[700] text-[#00704f]" : "font-[700] text-[#7a4f00]"}>{after <= 0 ? "Paid in full" : `Part payment · ${taka(after)} remaining`}</p>
              <div className="text-right text-sm">
                <p className="text-[var(--doc-ink-2)]">Received by</p>
                <p className="font-[650] text-[var(--doc-ink)]">{p.receivedBy}</p>
              </div>
            </div>
            <p className="mt-6 text-xs text-[var(--doc-ink-2)]">Computer-generated receipt from Smart Campus. Sample document for a concept build; it is not proof of payment.</p>
          </article>
        ) : (
          <div className="panel">
            <EmptyState icon={<ReceiptText size={20} strokeWidth={1.75} />} title="Receipt not found" action={<Button asChild variant="secondary"><Link to="/bills">Back to Bills</Link></Button>}>
              Receipts exist for every payment on your statement. This one may belong to another session.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </>
  );
}
