import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { FileArchive, FileText, Info, Link2, Mail, NotebookPen, Paperclip, Phone, Pin, Search, Send, Users, Video } from "lucide-react";
import { useAddComment, useAssessments, useAssignments, useAttendance, useLectures, useMaterials, usePeople, usePosts } from "../../api/hooks";
import * as seed from "../../data/seed";
import type { Bundle, Post, Resource } from "../../data/types";
import { PERIODS, now } from "../../lib/clock";
import { cn } from "../../lib/cn";
import { ago, fmt, pct, plural, until } from "../../lib/format";
import { Button } from "../../components/Button";
import { Avatar, Meter, Panel, Signal, Tag } from "../../components/Data";
import { Bars, EmptyState, ErrorState, Reveal } from "../../components/Feedback";
import { Disclosure } from "../../components/Accordion";
import { Segmented } from "../../components/Tabs";
import { useToast } from "../../components/Toast";
import { COURSE_TABS } from "./CourseLayout";
import { ScrollX } from "../../components/ScrollRegion";

export default function CourseTab() {
  const { slug = "", tab = "" } = useParams();
  const o = seed.offeringBySlug[slug];
  if (!o) return null;
  if (!COURSE_TABS.some((t) => t.key === tab)) return <Navigate to={`/courses/${slug}/discussion`} replace />;
  switch (tab) {
    case "discussion":
      return <Discussion code={o.code} />;
    case "assessments":
      return <Assessments code={o.code} />;
    case "attendance":
      return <Attendance code={o.code} />;
    case "lectures":
      return <Bundles code={o.code} kind="lectures" />;
    case "materials":
      return <Bundles code={o.code} kind="materials" />;
    case "assignments":
      return <Assignments code={o.code} />;
    default:
      return <People code={o.code} />;
  }
}

/* ─── Discussion ─────────────────────────────────────────────────────────── */

function Discussion({ code }: { code: string }) {
  const { data, isLoading, isError, refetch } = usePosts();
  const [filter, setFilter] = useState<"all" | "pinned">("all");
  const loc = useLocation();
  const posts = (data ?? [])
    .filter((p) => p.code === code && (filter === "all" || p.pinned))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.getTime() - a.at.getTime());

  useEffect(() => {
    if (!loc.hash || !data) return;
    const el = document.getElementById(loc.hash.slice(1));
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [loc.hash, data]);

  if (isError) return <ErrorState what="the discussion" onRetry={() => refetch()} />;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-2">{data ? plural(posts.length, "post") : " "}</p>
        <Segmented
          label="Filter posts"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All posts" },
            { value: "pinned", label: "Pinned" },
          ]}
        />
      </div>
      <Reveal loading={isLoading} skeleton={<Bars rows={5} />}>
        {posts.length ? (
          <ol className="flex flex-col gap-4">
            {posts.map((p) => (
              <li key={p.id}>
                <PostView post={p} highlight={loc.hash === `#${p.id}`} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="panel">
            <EmptyState icon={<Pin size={20} strokeWidth={1.75} />} title={filter === "pinned" ? "Nothing pinned yet" : "No posts yet"}>
              Teachers post syllabi, test instructions and schedule changes here. Pinned posts stay at the top for every section.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </div>
  );
}

function PostView({ post, highlight }: { post: Post; highlight?: boolean }) {
  const t = seed.teachers[post.authorId];
  const [text, setText] = useState("");
  const add = useAddComment();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    add.mutate({ postId: post.id, text: v }, { onSuccess: () => setText("") });
  };
  return (
    <article id={post.id} className={cn("panel scroll-mt-28 overflow-hidden transition-[box-shadow] duration-300", highlight && "shadow-[0_0_0_3px_color-mix(in_srgb,var(--amber)_55%,transparent)]")} aria-labelledby={`${post.id}-t`}>
      <header className="flex items-center gap-3 px-4 pt-4 lg:px-5">
        <Avatar name={t.name} size="md" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-[640] text-ink">{t.name}</p>
          <p className="text-xs text-ink-3">
            {t.designation} · <time dateTime={post.at.toISOString()}>{ago(post.at)}</time>
          </p>
        </div>
        {post.pinned ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-[600] text-ink-2">
            <Pin size={14} strokeWidth={1.75} aria-hidden />
            Pinned for all sections
          </span>
        ) : null}
      </header>
      <div className="px-4 pb-4 pt-3 lg:px-5">
        <h3 id={`${post.id}-t`} className="text-md font-[660] text-ink">
          {post.title}
        </h3>
        <div className="mt-2 flex max-w-[68ch] flex-col gap-2.5 text-[0.9375rem] text-ink">
          {post.blocks.map((b, i) =>
            b.kind === "p" ? (
              <p key={i}>{b.text}</p>
            ) : b.kind === "list" ? (
              <ul key={i} className="ml-5 list-disc marker:text-ink-3">
                {b.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            ) : (
              <p key={i} className="flex gap-2.5 rounded-md bg-surface-2 px-3 py-2.5 text-sm text-ink">
                <Info size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-2" aria-hidden />
                {b.text}
              </p>
            ),
          )}
        </div>
      </div>
      <div className="border-t border-line bg-surface-2/50 px-4 py-3 lg:px-5">
        {post.comments.length ? (
          <ul className="mb-3 flex flex-col gap-3">
            {post.comments.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <Avatar name={c.author} size="sm" you={c.author === seed.student.name} />
                <div className="min-w-0 text-sm">
                  <p>
                    <span className="font-[640] text-ink">{c.author}</span>
                    {c.authorRole === "teacher" ? <span className="ml-1.5 text-xs font-[600] text-primary">Teacher</span> : null}
                    <span className="ml-1.5 text-xs text-ink-3">{ago(c.at)}</span>
                  </p>
                  <p className="text-ink-2">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <Avatar name={seed.student.name} you size="sm" />
          <label htmlFor={`${post.id}-c`} className="sr-only">
            Write a comment
          </label>
          <div className="field h-10 flex-1 rounded-full pr-1">
            <input id={`${post.id}-c`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment" autoComplete="off" />
            <button type="submit" disabled={!text.trim() || add.isPending} aria-label="Send comment" className="grid size-8 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-surface-2 disabled:text-ink-3">
              <Send size={16} strokeWidth={1.75} />
            </button>
          </div>
        </form>
      </div>
    </article>
  );
}

/* ─── Assessments ────────────────────────────────────────────────────────── */

function Assessments({ code }: { code: string }) {
  const { data, isLoading, isError, refetch } = useAssessments();
  if (isError) return <ErrorState what="assessments" onRetry={() => refetch()} />;
  const rows = (data ?? []).filter((a) => a.code === code).sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
  const done = rows.filter((r) => r.obtained != null);
  const got = done.reduce((s, r) => s + (r.obtained ?? 0), 0);
  const of = done.reduce((s, r) => s + r.max, 0);
  const total = rows.reduce((s, r) => s + r.max, 0);
  return (
    <Reveal loading={isLoading} skeleton={<Bars rows={5} />}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-2">
          {done.length ? (
            <>
              Published so far: <span className="num font-[640] text-ink">{got}</span> of <span className="num">{of}</span> marks ({pct((got / of) * 100)}), from {plural(done.length, "assessment")}. {total - of} marks still to come.
            </>
          ) : (
            "No marks are published for this course yet."
          )}
        </p>
        <ScrollX label={`Marks for ${code}`} className="panel">
          <table className="table min-w-[44rem]">
            <thead>
              <tr>
                <th scope="col">Assessment</th>
                <th scope="col">Date</th>
                <th scope="col" className="n">
                  Marks
                </th>
                <th scope="col" className="n">
                  Highest
                </th>
                <th scope="col">OBE</th>
                <th scope="col">Submitted by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <th scope="row" className="font-[620] text-ink">
                    {r.name}
                  </th>
                  <td className="num whitespace-nowrap text-ink-2">{r.date ? fmt.dayShort(r.date) : "—"}</td>
                  <td className="n">
                    {r.obtained != null ? (
                      <span className="font-[660] text-ink">
                        {r.obtained}
                        <span className="font-normal text-ink-3">/{r.max}</span>
                      </span>
                    ) : r.state === "upcoming" ? (
                      <Signal tone="neutral" dot={false}>
                        {r.date ? until(r.date) : "Upcoming"}
                      </Signal>
                    ) : (
                      <Signal tone="caution">Awaiting marks</Signal>
                    )}
                  </td>
                  <td className="n text-ink-2">{r.highest ?? "—"}</td>
                  <td className="text-ink-2">{r.obe ?? "—"}</td>
                  <td className="text-ink-2">{r.submittedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollX>
      </div>
    </Reveal>
  );
}

/* ─── Attendance ─────────────────────────────────────────────────────────── */

function Attendance({ code }: { code: string }) {
  const { data, isLoading, isError, refetch } = useAttendance();
  if (isError) return <ErrorState what="attendance" onRetry={() => refetch()} />;
  const s = data?.summary.find((r) => r.code === code);
  const recs = (data?.records ?? []).filter((r) => r.code === code).slice().reverse();
  const tone = s?.standing === "below" ? "danger" : s?.standing === "watch" ? "caution" : "ok";
  return (
    <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
      {s ? (
        <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <Panel id="att-sum" title="Summary" className="self-start">
            <div className="px-4 py-4 lg:px-5">
              <p className="flex items-baseline gap-3">
                <span className={cn("display-num text-3xl", tone === "danger" ? "text-danger" : "text-ink")}>{pct(s.pct, 1)}</span>
                <Signal tone={tone}>{s.standing === "below" ? `Under ${seed.ATTENDANCE_LINE}%` : s.standing === "watch" ? "Close to the line" : "On track"}</Signal>
              </p>
              <Meter className="mt-4" value={s.pct} max={100} line={seed.ATTENDANCE_LINE} tone={tone} label={`Attendance ${pct(s.pct, 1)}, line at ${seed.ATTENDANCE_LINE}%`} />
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { k: "Present", v: s.present },
                  { k: "Absent", v: s.absent },
                  { k: "Held", v: s.total },
                ].map((x) => (
                  <div key={x.k} className="rounded-md bg-surface-2 py-2">
                    <dt className="caps text-ink-3">{x.k}</dt>
                    <dd className="num text-md font-[680] text-ink">{x.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-ink-2">
                {s.advice.kind === "can-miss"
                  ? `You can miss ${plural(s.advice.n, "more class", "more classes")} and stay above the ${seed.ATTENDANCE_LINE}% line. ${s.remaining} classes remain this term.`
                  : s.advice.kind === "need"
                    ? `Attend the next ${plural(s.advice.n, "class", "classes")} in a row to get back above ${seed.ATTENDANCE_LINE}%. ${s.remaining} classes remain this term.`
                    : `This course can't reach ${seed.ATTENDANCE_LINE}% this term. Talk to your advisor.`}
              </p>
              <p className="mt-3 text-xs text-ink-3">The {seed.ATTENDANCE_LINE}% line is illustrative in this concept build.</p>
            </div>
          </Panel>
          <ScrollX label={`Attendance for ${code}`} className="panel">
            <table className="table min-w-[34rem]">
              <caption className="sr-only">Class-by-class attendance for {code}, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Day</th>
                  <th scope="col">Time</th>
                  <th scope="col">Status</th>
                  <th scope="col">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recs.map((r) => {
                  const p = PERIODS[r.period - 1];
                  return (
                    <tr key={r.date.getTime()}>
                      <td className="num whitespace-nowrap text-ink">{fmt.long(r.date)}</td>
                      <td className="text-ink-2">{fmt.weekdayLong(r.date)}</td>
                      <td className="num text-ink-2">
                        {p.start}–{p.end}
                      </td>
                      <td>{r.status === "P" ? <Signal tone="ok">Present</Signal> : <Signal tone="danger">Absent</Signal>}</td>
                      <td className="text-ink-2">{r.remarks ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollX>
        </div>
      ) : null}
    </Reveal>
  );
}

/* ─── Lectures & materials ───────────────────────────────────────────────── */

const resIcon = (r: Resource) => (r.kind === "zip" ? FileArchive : r.kind === "video" ? Video : r.kind === "link" ? Link2 : FileText);

function Bundles({ code, kind }: { code: string; kind: "lectures" | "materials" }) {
  const lectures = useLectures();
  const materials = useMaterials();
  const q = kind === "lectures" ? lectures : materials;
  const toast = useToast();
  if (q.isError) return <ErrorState what={kind} onRetry={() => q.refetch()} />;
  const list = (q.data ?? []).filter((b) => b.code === code).sort((a, b) => b.at.getTime() - a.at.getTime());
  const o = seed.offeringByCode[code];
  return (
    <div className="mx-auto max-w-3xl">
      <Reveal loading={q.isLoading} skeleton={<Bars rows={5} />}>
        {list.length ? (
          <ul className="panel divide-y divide-line overflow-hidden">
            {list.map((b, i) => (
              <li key={b.id}>
                <BundleRow bundle={b} defaultOpen={i === 0} onDownload={() => toast({ title: "Sample file", description: "Downloads are switched off in this concept build.", tone: "info" })} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel">
            <EmptyState icon={<Paperclip size={20} strokeWidth={1.75} />} title={kind === "lectures" ? "No lectures posted yet" : "No materials yet"}>
              {seed.teachers[o.teacherIds[0]].name} posts {kind === "lectures" ? "weekly slides and notes" : "practice sheets, references and recordings"} here. You'll get a notification when something new arrives.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </div>
  );
}

function BundleRow({ bundle, defaultOpen, onDownload }: { bundle: Bundle; defaultOpen?: boolean; onDownload: () => void }) {
  const t = seed.teachers[bundle.authorId];
  return (
    <Disclosure
      defaultOpen={defaultOpen}
      headClassName="px-4 py-3.5 hover:bg-surface-2/60 lg:px-5"
      summary={
        <span className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">
            <FileText size={18} strokeWidth={1.75} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.9375rem] font-[640] text-ink">{bundle.title}</span>
            <span className="block text-xs text-ink-3">
              {t.name} · {fmt.dayShort(bundle.at)} · {plural(bundle.resources.length, "file")}
            </span>
          </span>
        </span>
      }
    >
      <ul className="px-4 pb-3 pl-16 lg:px-5 lg:pl-[4.25rem]">
        {bundle.resources.map((r) => {
          const Icon = resIcon(r);
          return (
            <li key={r.name} className="flex items-center gap-3 border-t border-line py-2 first:border-t-0">
              <Icon size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{r.name}</span>
              {r.size ? <span className="num shrink-0 text-xs text-ink-3">{r.size}</span> : null}
              <Button variant="ghost" size="sm" onClick={onDownload} aria-label={`${r.kind === "video" ? "Open" : "Download"} ${r.name}`}>
                {r.kind === "video" ? "Open" : "Download"}
              </Button>
            </li>
          );
        })}
      </ul>
    </Disclosure>
  );
}

/* ─── Assignments ────────────────────────────────────────────────────────── */

function Assignments({ code }: { code: string }) {
  const { data, isLoading, isError, refetch } = useAssignments();
  const toast = useToast();
  if (isError) return <ErrorState what="assignments" onRetry={() => refetch()} />;
  const list = (data ?? []).filter((a) => a.code === code);
  const o = seed.offeringByCode[code];
  return (
    <div className="mx-auto max-w-3xl">
      <Reveal loading={isLoading} skeleton={<Bars rows={3} />}>
        {list.length ? (
          <ul className="flex flex-col gap-4">
            {list.map((a) => {
              const overdue = a.state === "open" && a.due < now();
              return (
                <li key={a.id} className="panel p-4 lg:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-md font-[660] text-ink">{a.title}</h3>
                      <p className="mt-0.5 text-sm text-ink-2">
                        Due {fmt.dayShort(a.due)}, {fmt.time(a.due)}
                        {a.state === "open" ? ` · ${until(a.due)}` : ""}
                        {a.max ? ` · ${a.max} marks` : ""}
                      </p>
                    </div>
                    {a.state === "graded" ? (
                      <Signal tone="ok">
                        Graded · {a.marks}/{a.max}
                      </Signal>
                    ) : a.state === "submitted" ? (
                      <Signal tone="ok">Submitted</Signal>
                    ) : overdue ? (
                      <Signal tone="danger">Overdue</Signal>
                    ) : (
                      <Signal tone="caution">Open</Signal>
                    )}
                  </div>
                  <p className="mt-3 max-w-[68ch] text-[0.9375rem] text-ink">{a.brief}</p>
                  {a.state === "open" ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button icon={<NotebookPen size={16} strokeWidth={1.75} />} onClick={() => toast({ title: "Submission is switched off", description: "This concept build doesn't accept files.", tone: "info" })}>
                        Submit work
                      </Button>
                      <span className="text-xs text-ink-3">One PDF, up to 10 MB.</span>
                    </div>
                  ) : a.submittedAt ? (
                    <p className="mt-3 text-xs text-ink-3">Submitted {fmt.dayShort(a.submittedAt)}, {fmt.time(a.submittedAt)}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="panel">
            <EmptyState icon={<NotebookPen size={20} strokeWidth={1.75} />} title="No assignments yet">
              When {seed.teachers[o.teacherIds[0]].name} posts one, it appears here with its due date, and the departure board counts down to it.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </div>
  );
}

/* ─── People ─────────────────────────────────────────────────────────────── */

function People({ code }: { code: string }) {
  const { data, isLoading, isError, refetch } = usePeople();
  const [q, setQ] = useState("");
  const o = seed.offeringByCode[code];
  const teachers = o.teacherIds.map((id) => seed.teachers[id]);
  const people = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((p) => !s || p.name.toLowerCase().includes(s) || p.roll.includes(s));
  }, [data, q]);
  if (isError) return <ErrorState what="the class list" onRetry={() => refetch()} />;
  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Panel id="teachers" title={teachers.length > 1 ? "Teachers" : "Teacher"} className="self-start">
        <ul>
          {teachers.map((t) => (
            <li key={t.id} className="border-b border-line px-4 py-4 last:border-b-0 lg:px-5">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} size="lg" />
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-[640] text-ink">{t.name}</p>
                  <p className="text-sm text-ink-2">{t.designation}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1 text-sm">
                <a href={`tel:${t.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 rounded-sm text-ink-2 no-underline hover:text-ink">
                  <Phone size={14} strokeWidth={1.75} aria-hidden />
                  <span className="num">{t.phone}</span>
                </a>
                <a href={`mailto:${t.email}`} className="flex items-center gap-2 rounded-sm text-ink-2 no-underline hover:text-ink">
                  <Mail size={14} strokeWidth={1.75} aria-hidden />
                  <span className="truncate">{t.email}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel
        id="classmates"
        title="Classmates"
        action={<span className="text-sm text-ink-2">{data ? plural(data.length, "student") : ""}</span>}
      >
        <div className="border-b border-line px-4 py-3 lg:px-5">
          <label htmlFor="people-q" className="sr-only">
            Find a classmate
          </label>
          <div className="field h-10">
            <Search size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input id="people-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find by name or roll" autoComplete="off" />
          </div>
        </div>
        <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
          {people.length ? (
            <ul className="grid sm:grid-cols-2">
              {people.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 lg:px-5 sm:odd:border-r">
                  <Avatar name={p.name} size="md" you={p.isYou} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-[600] text-ink">
                      {p.name}
                      {p.isYou ? <span className="ml-1.5 text-xs font-[650] text-primary">You</span> : null}
                    </p>
                    <p className="num truncate text-xs text-ink-3">{p.roll}</p>
                  </div>
                  {p.regType === "Retake" ? <Tag>Retake</Tag> : null}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Users size={20} strokeWidth={1.75} />} title="No one matches that search">
              Try part of a name or the last digits of a roll number.
            </EmptyState>
          )}
        </Reveal>
      </Panel>
      <p className="text-xs text-ink-3 lg:col-span-2">
        Names and rolls are synthetic sample data. <Link to="/courses" className="link">Back to Running Courses</Link>
      </p>
    </div>
  );
}
