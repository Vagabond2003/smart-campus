import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router";
import { FilePlus2, Link2, NotebookPen, Paperclip, Pin, Search, X } from "lucide-react";
import { useAddBundle, useCreateAssignment, useCreatePost, useLectures, useMaterials, usePosts, useTeachCourse } from "../../api/hooks";
import { gradeState, type MeetingRow } from "../../api/teach";
import * as seed from "../../data/seed";
import { roster, rollSuffix, teacher, teaches } from "../../data/campus";
import type { PostBlock, Resource } from "../../data/types";
import { addDays, atTime, now, PERIODS, startOfDay } from "../../lib/clock";
import { cn } from "../../lib/cn";
import { fmt, pct, plural, until } from "../../lib/format";
import { Button } from "../../components/Button";
import { Meter, Panel, Signal, Tag } from "../../components/Data";
import { Bars, EmptyState, Reveal } from "../../components/Feedback";
import { ScrollX } from "../../components/ScrollRegion";
import { useToast } from "../../components/Toast";
import { useIsPhone } from "../../lib/useMediaQuery";
import { BundleRow, PostView } from "../course/CourseTab";
import { TEACH_COURSE_TABS } from "./TeachCourseLayout";
import { firstName, RollSignal, SheetSignal } from "./parts";

export default function TeachCourseTab() {
  const { slug = "", tab = "" } = useParams();
  const o = seed.offeringBySlug[slug];
  if (!o || !teaches(o.code)) return null;
  if (!TEACH_COURSE_TABS.some((t) => t.key === tab)) return <Navigate to={`/teach/courses/${slug}/roll`} replace />;
  switch (tab) {
    case "roll":
      return <RollTab code={o.code} />;
    case "marks":
      return <MarksTab code={o.code} />;
    case "discussion":
      return <DiscussionTab code={o.code} />;
    case "lectures":
      return <BundlesTab code={o.code} kind="lectures" />;
    case "materials":
      return <BundlesTab code={o.code} kind="materials" />;
    case "assignments":
      return <AssignmentsTab code={o.code} />;
    default:
      return <PeopleTab code={o.code} />;
  }
}

/* ─── Roll register ──────────────────────────────────────────────────────── */

function RollTab({ code }: { code: string }) {
  const { data, isLoading } = useTeachCourse(code);
  const phone = useIsPhone();
  const rows = data ? Object.entries(data.attendance) : [];
  const avg = rows.length ? rows.reduce((s, [, r]) => s + r.pct, 0) / rows.length : 0;
  const under = rows.filter(([, r]) => r.standing === "below").sort((a, b) => a[1].pct - b[1].pct);
  const held = data?.meetings.filter((m) => m.roll).length ?? 0;
  return (
    <Reveal loading={isLoading} skeleton={<Bars rows={6} />}>
      <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel id="roll-sum" title="Class attendance" className="self-start">
          <div className="px-4 py-4 lg:px-5">
            <p className="flex items-baseline gap-3">
              <span className="display-num text-3xl text-ink">{pct(avg)}</span>
              <span className="text-sm text-ink-2">average over {plural(held, "meeting")}</span>
            </p>
            <Meter className="mt-4" value={avg} max={100} line={seed.ATTENDANCE_LINE} tone={avg < seed.ATTENDANCE_LINE ? "danger" : "ok"} label={`Class average ${pct(avg)}, line at ${seed.ATTENDANCE_LINE}%`} />
          </div>
          <div className="border-t border-line">
            <p className={cn("band px-4 pb-1 pt-3 text-[0.8125rem] lg:px-5", under.length ? "text-danger" : "text-ink-2")}>{under.length ? `${under.length} under ${seed.ATTENDANCE_LINE}%` : `Everyone above ${seed.ATTENDANCE_LINE}%`}</p>
            <ul className="pb-2">
              {under.map(([id, r]) => {
                const p = roster.find((x) => x.id === id)!;
                return (
                  <li key={id}>
                    <Link to={`/teach/students/${id}`} className="flex items-center justify-between gap-3 px-4 py-1.5 text-sm no-underline hover:bg-surface-2/60 lg:px-5">
                      <span className="min-w-0 truncate text-ink">
                        <span className="num mr-2 font-[700] text-ink-2 [font-stretch:84%]">{rollSuffix(p)}</span>
                        {p.name}
                      </span>
                      <span className="num shrink-0 font-[640] text-danger">{pct(r.pct, 1)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </Panel>
        {phone ? (
          <ol className="panel divide-y divide-line" aria-label={`Roll register for ${code}, newest first`}>
            {data?.meetings.map((m) => (
              <MeetingListRow key={m.key} m={m} />
            ))}
          </ol>
        ) : (
          <ScrollX label={`Roll register for ${code}`} className="panel">
            <table className="table min-w-[40rem]">
              <caption className="sr-only">Every meeting of {code} so far, newest first</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col" className="n">
                    Present
                  </th>
                  <th scope="col" className="n">
                    Absent
                  </th>
                  <th scope="col">Roll</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.meetings.map((m) => (
                  <MeetingTableRow key={m.key} m={m} />
                ))}
              </tbody>
            </table>
          </ScrollX>
        )}
      </div>
    </Reveal>
  );
}

/** A meeting on a phone: the date and time, the counts, the roll's state and its action, stacked. */
function MeetingListRow({ m }: { m: MeetingRow }) {
  const p1 = PERIODS[m.session.period - 1];
  const p2 = PERIODS[m.session.period - 1 + m.session.span - 1];
  const absent = m.roll?.absent.length ?? 0;
  return (
    <li className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3", m.live && "bg-caution-wash/45")}>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-[620] text-ink">{fmt.dayShort(m.session.start)}</span>
        <span className="num block text-xs text-ink-3">
          {p1.start}–{p2.end}
          {m.roll ? (
            <>
              {" "}
              · {roster.length - absent} present · <span className={absent ? "font-[640] text-danger" : undefined}>{absent} absent</span>
            </>
          ) : null}
        </span>
      </span>
      <RollSignal status={m.status} live={m.live} start={m.session.start}>
        {m.status === "taken" ? (m.roll?.editedAt ? "Taken · edited" : "Taken by you") : undefined}
      </RollSignal>
      {m.status === "due" ? (
        <Button asChild size="sm" variant={m.live ? "primary" : "secondary"}>
          <Link to={`/teach/roll/${m.key}`}>Take roll</Link>
        </Button>
      ) : m.roll ? (
        <Button asChild size="sm" variant="ghost">
          <Link to={`/teach/roll/${m.key}`} aria-label={`Edit the roll for ${fmt.dayShort(m.session.start)}`}>
            Edit
          </Link>
        </Button>
      ) : null}
    </li>
  );
}

function MeetingTableRow({ m }: { m: MeetingRow }) {
  const p1 = PERIODS[m.session.period - 1];
  const p2 = PERIODS[m.session.period - 1 + m.session.span - 1];
  const absent = m.roll?.absent.length ?? 0;
  return (
    <tr className={m.live ? "bg-caution-wash/45" : undefined}>
      <td className="whitespace-nowrap text-ink">{fmt.dayShort(m.session.start)}</td>
      <td className="num whitespace-nowrap text-ink-2">
        {p1.start}–{p2.end}
      </td>
      <td className="n text-ink">{m.roll ? roster.length - absent : "—"}</td>
      <td className={cn("n", absent ? "font-[640] text-danger" : "text-ink-2")}>{m.roll ? absent : "—"}</td>
      <td>
        <RollSignal status={m.status} live={m.live} start={m.session.start}>
          {m.status === "taken" ? (m.roll?.editedAt ? "Taken · edited" : "Taken by you") : undefined}
        </RollSignal>
      </td>
      <td className="n">
        {m.status === "due" ? (
          <Button asChild size="sm" variant={m.live ? "primary" : "secondary"}>
            <Link to={`/teach/roll/${m.key}`}>Take roll</Link>
          </Button>
        ) : m.roll ? (
          <Button asChild size="sm" variant="ghost">
            <Link to={`/teach/roll/${m.key}`} aria-label={`Edit the roll for ${fmt.dayShort(m.session.start)}`}>
              Edit
            </Link>
          </Button>
        ) : null}
      </td>
    </tr>
  );
}

/* ─── Marks ──────────────────────────────────────────────────────────────── */

function MarksTab({ code }: { code: string }) {
  const { data, isLoading } = useTeachCourse(code);
  const phone = useIsPhone();
  const o = seed.offeringByCode[code];
  const linkFor = (name: string) => {
    const linked = data?.assignments.find((x) => x.assessment === name);
    return { linked, to: linked ? `/teach/courses/${o.slug}/assignments/${linked.id}` : `/teach/courses/${o.slug}/marks/${encodeURIComponent(name)}` };
  };
  return (
    <Reveal loading={isLoading} skeleton={<Bars rows={5} />}>
      {phone ? (
        <ul className="panel divide-y divide-line" aria-label={`Assessments for ${code}`}>
          {data?.sheets.map((r) => {
            const a = r.assessment;
            const { linked, to } = linkFor(a.name);
            return (
              <li key={a.name} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-[620] text-ink">{a.name}</span>
                    <span className="block text-xs text-ink-3">
                      Out of {a.max}
                      {a.date ? ` · ${fmt.dayShort(a.date)}` : ""}
                      {linked ? " · from Assignment grades" : ""}
                    </span>
                  </span>
                  <SheetSignal status={r.status} date={a.date} />
                </div>
                {r.status === "upcoming" ? null : (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="num text-xs text-ink-2">
                      {r.entered}/{roster.length} entered · average {r.average != null ? r.average.toFixed(1) : "—"} · highest {r.highest ?? "—"}
                    </span>
                    <Button asChild size="sm" variant={r.status === "published" ? "ghost" : "secondary"}>
                      <Link to={to}>{linked ? "Grade" : r.status === "published" ? "View" : "Enter marks"}</Link>
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ScrollX label={`Assessments for ${code}`} className="panel">
          <table className="table min-w-[48rem]">
            <caption className="sr-only">Every assessment for {code} and where its marks stand</caption>
            <thead>
              <tr>
                <th scope="col">Assessment</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col" className="n">
                  Entered
                </th>
                <th scope="col" className="n">
                  Average
                </th>
                <th scope="col" className="n">
                  Highest
                </th>
                <th scope="col">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.sheets.map((r) => {
                const a = r.assessment;
                const { linked, to } = linkFor(a.name);
                return (
                  <tr key={a.name}>
                    <th scope="row">
                      <span className="block font-[620] text-ink">{a.name}</span>
                      <span className="block text-xs text-ink-3">
                        Out of {a.max}
                        {a.obe ? ` · OBE ${a.obe}` : ""}
                        {linked ? " · from Assignment grades" : ""}
                      </span>
                    </th>
                    <td className="num whitespace-nowrap text-ink-2">{a.date ? fmt.dayShort(a.date) : "—"}</td>
                    <td>
                      <SheetSignal status={r.status} date={a.date} />
                    </td>
                    <td className="n text-ink-2">{r.status === "upcoming" ? "—" : `${r.entered}/${roster.length}`}</td>
                    <td className="n text-ink-2">{r.average != null ? r.average.toFixed(1) : "—"}</td>
                    <td className="n text-ink-2">{r.highest ?? "—"}</td>
                    <td className="n">
                      {r.status === "upcoming" ? null : (
                        <Button asChild size="sm" variant={r.status === "published" ? "ghost" : "secondary"}>
                          <Link to={to}>{linked ? "Grade" : r.status === "published" ? "View" : "Enter marks"}</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollX>
      )}
      <p className="mt-3 text-xs text-ink-3">Students see a sheet only once it's published. Published marks can be corrected but not withdrawn.</p>
    </Reveal>
  );
}

/* ─── Discussion ─────────────────────────────────────────────────────────── */

/** Paragraphs split on blank lines; a paragraph whose every line starts with "- " is a list. */
function toBlocks(body: string, note: string): PostBlock[] {
  const blocks: PostBlock[] = body
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const lines = para.split("\n").map((l) => l.trim());
      return lines.every((l) => /^[-•*]\s+/.test(l)) ? { kind: "list" as const, items: lines.map((l) => l.replace(/^[-•*]\s+/, "")) } : { kind: "p" as const, text: lines.join(" ") };
    });
  if (note.trim()) blocks.push({ kind: "note", text: note.trim() });
  return blocks;
}

function DiscussionTab({ code }: { code: string }) {
  const { data, isLoading } = usePosts();
  const loc = useLocation();
  const posts = (data ?? []).filter((p) => p.code === code).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.at.getTime() - a.at.getTime());
  useEffect(() => {
    if (!loc.hash || !data) return;
    document.getElementById(loc.hash.slice(1))?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [loc.hash, data]);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Composer code={code} />
      <Reveal loading={isLoading} skeleton={<Bars rows={4} />}>
        {posts.length ? (
          <ol className="flex flex-col gap-4">
            {posts.map((p) => (
              <li key={p.id}>
                <PostView post={p} asTeacher highlight={loc.hash === `#${p.id}`} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="panel">
            <EmptyState icon={<Pin size={20} strokeWidth={1.75} />} title="No posts yet">
              Post the syllabus for the next test, schedule changes or lab instructions. Students get a notification for each one.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </div>
  );
}

function Composer({ code }: { code: string }) {
  const create = useCreatePost();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [pinned, setPinned] = useState(false);
  const [open, setOpen] = useState(false);
  const blocks = toBlocks(body, note);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !blocks.length) return;
    create.mutate(
      { code, title: title.trim(), blocks, pinned },
      {
        onSuccess: () => {
          toast({ title: `Posted to ${code}`, description: `Section ${seed.student.section} has a notification.` });
          setTitle("");
          setBody("");
          setNote("");
          setPinned(false);
          setOpen(false);
        },
      },
    );
  };
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="panel flex w-full items-center gap-3 px-4 py-3.5 text-left text-[0.9375rem] text-ink-3 transition-colors duration-150 hover:border-line-strong lg:px-5">
        <FilePlus2 size={18} strokeWidth={1.75} className="text-ink-2" aria-hidden />
        Write a post for {code}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="panel flex flex-col gap-4 p-4 lg:p-5" aria-label={`New post in ${code}`}>
      <div>
        <label htmlFor="post-title" className="field-label">
          Title
        </label>
        <div className="field">
          <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Class Test 03: syllabus and instructions" maxLength={160} autoComplete="off" />
        </div>
      </div>
      <div>
        <label htmlFor="post-body" className="field-label">
          Post
        </label>
        <textarea id="post-body" className="field-area" value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Leave a blank line between paragraphs.\n- Start lines with a dash for a list"} />
      </div>
      <div>
        <label htmlFor="post-note" className="field-label">
          Note <span className="font-normal text-ink-3">(optional, shown highlighted)</span>
        </label>
        <div className="field">
          <input id="post-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: bring your own calculator" maxLength={300} autoComplete="off" />
        </div>
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="size-4 accent-[var(--primary)]" />
        Pin for all sections
      </label>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || !blocks.length || create.isPending}>
          {create.isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}

/* ─── Lectures and materials ─────────────────────────────────────────────── */

const kindOf = (name: string): Resource["kind"] => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return "slides";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "zip";
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
  return "pdf";
};
const sizeOf = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);

function BundlesTab({ code, kind }: { code: string; kind: "lectures" | "materials" }) {
  const lectures = useLectures();
  const materials = useMaterials();
  const q = kind === "lectures" ? lectures : materials;
  const toast = useToast();
  const list = (q.data ?? []).filter((b) => b.code === code).sort((a, b) => b.at.getTime() - a.at.getTime());
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <BundleComposer code={code} kind={kind} />
      <Reveal loading={q.isLoading} skeleton={<Bars rows={5} />}>
        {list.length ? (
          <ul className="panel divide-y divide-line overflow-hidden">
            {list.map((b, i) => (
              <li key={b.id}>
                <BundleRow bundle={b} defaultOpen={i === 0} onDownload={() => toast({ title: "Listed by name", description: "Opening files arrives with file sharing.", tone: "info" })} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="panel">
            <EmptyState icon={<Paperclip size={20} strokeWidth={1.75} />} title={kind === "lectures" ? "No lectures posted yet" : "No materials yet"}>
              Post {kind === "lectures" ? "each week's slides and notes" : "practice sheets, references and recordings"}. Students get a notification for each.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </div>
  );
}

function BundleComposer({ code, kind }: { code: string; kind: "lectures" | "materials" }) {
  const add = useAddBundle();
  const toast = useToast();
  const picker = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<Resource[]>([]);
  const [url, setUrl] = useState("");
  const [urlLabel, setUrlLabel] = useState("");
  const urlOk = !url.trim() || /^https?:\/\/\S+\.\S+/.test(url.trim());
  const resources: Resource[] = [...files, ...(url.trim() && urlOk ? [{ name: urlLabel.trim() || url.trim().replace(/^https?:\/\//, "").slice(0, 60), kind: (/youtu|vimeo|drive\.google.*video/.test(url) ? "video" : "link") as Resource["kind"], url: url.trim() }] : [])];
  const reset = () => {
    setTitle("");
    setFiles([]);
    setUrl("");
    setUrlLabel("");
    setOpen(false);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !resources.length || !urlOk) return;
    add.mutate(
      { code, section: kind, title: title.trim(), resources: resources.slice(0, 10) },
      {
        onSuccess: () => {
          toast({ title: `Posted to ${kind === "lectures" ? "Lectures" : "Materials"}`, description: `${code} students have a notification.` });
          reset();
        },
      },
    );
  };
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="panel flex w-full items-center gap-3 px-4 py-3.5 text-left text-[0.9375rem] text-ink-3 transition-colors duration-150 hover:border-line-strong lg:px-5">
        <FilePlus2 size={18} strokeWidth={1.75} className="text-ink-2" aria-hidden />
        {kind === "lectures" ? `Post this week's lecture files` : "Post materials"}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="panel flex flex-col gap-4 p-4 lg:p-5" aria-label={`Post ${kind} for ${code}`}>
      <div>
        <label htmlFor="b-title" className="field-label">
          Title
        </label>
        <div className="field">
          <input id="b-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "lectures" ? "For example: Week 9: Sequential circuits" : "For example: Mid term practice problems"} maxLength={160} autoComplete="off" />
        </div>
      </div>
      <div>
        <span className="field-label">Files</span>
        <input
          ref={picker}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const picked = [...(e.currentTarget.files ?? [])].map((f) => ({ name: f.name, kind: kindOf(f.name), size: sizeOf(f.size) }));
            e.currentTarget.value = "";
            setFiles((prev) => [...prev, ...picked.filter((p) => !prev.some((x) => x.name === p.name))].slice(0, 10));
          }}
        />
        {files.length ? (
          <ul className="mb-2 divide-y divide-line rounded-md border border-line">
            {files.map((f) => (
              <li key={f.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                <Paperclip size={15} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-ink">{f.name}</span>
                <span className="num shrink-0 text-xs text-ink-3">{f.size}</span>
                <button type="button" aria-label={`Remove ${f.name}`} className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink" onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}>
                  <X size={14} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Button type="button" variant="secondary" size="sm" icon={<Paperclip size={15} strokeWidth={1.75} />} onClick={() => picker.current?.click()}>
          Choose files
        </Button>
        <p className="mt-1.5 text-xs text-ink-3">Only the names are recorded for now; uploading arrives with file sharing.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div>
          <label htmlFor="b-url" className="field-label">
            Link <span className="font-normal text-ink-3">(optional, opens for real)</span>
          </label>
          <div className={cn("field", !urlOk && "is-error")}>
            <Link2 size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input id="b-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" autoComplete="off" aria-invalid={!urlOk || undefined} />
          </div>
          {!urlOk ? <p className="mt-1.5 text-sm text-danger">Use a full address starting with https://</p> : null}
        </div>
        <div>
          <label htmlFor="b-url-label" className="field-label">
            Link name
          </label>
          <div className="field">
            <input id="b-url-label" value={urlLabel} onChange={(e) => setUrlLabel(e.target.value)} placeholder="Recorded lecture" maxLength={80} autoComplete="off" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        <Button type="button" variant="ghost" onClick={reset}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || !resources.length || !urlOk || add.isPending}>
          {add.isPending ? "Posting…" : `Post ${plural(resources.length, "item")}`}
        </Button>
      </div>
    </form>
  );
}

/* ─── Assignments ────────────────────────────────────────────────────────── */

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function AssignmentsTab({ code }: { code: string }) {
  const { data, isLoading } = useTeachCourse(code);
  const o = seed.offeringByCode[code];
  const list = [...(data?.assignments ?? [])].sort((a, b) => b.due.getTime() - a.due.getTime());
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <AssignmentComposer code={code} />
      <Reveal loading={isLoading} skeleton={<Bars rows={3} />}>
        {list.length ? (
          <ul className="flex flex-col gap-4">
            {list.map((a) => {
              const g = gradeState(a);
              const open = a.due > now();
              return (
                <li key={a.id} className="panel p-4 lg:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-md font-[660] text-ink">{a.title}</h3>
                      <p className="mt-0.5 text-sm text-ink-2">
                        Due {fmt.dayShort(a.due)}, {fmt.time(a.due)}
                        {open ? ` · ${until(a.due)}` : ""} · {a.max} marks
                      </p>
                    </div>
                    {g.state === "published" ? <Signal tone="ok">Grades published</Signal> : g.state === "draft" ? <Signal tone="caution">Grading draft</Signal> : open ? <Signal tone="caution">Open</Signal> : <Signal tone="danger">To grade</Signal>}
                  </div>
                  <p className="mt-3 max-w-[68ch] text-[0.9375rem] text-ink">{a.brief}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button asChild variant={open ? "secondary" : "primary"} icon={<NotebookPen size={16} strokeWidth={1.75} />}>
                      <Link to={`/teach/courses/${o.slug}/assignments/${a.id}`}>{g.state === "published" ? "View grades" : open ? "See submissions" : "Grade"}</Link>
                    </Button>
                    <span className="text-sm text-ink-2">
                      <span className="num font-[640] text-ink">{g.submitted}</span> of {g.total} handed in{g.late ? ` · ${g.late} late` : ""}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="panel">
            <EmptyState icon={<NotebookPen size={20} strokeWidth={1.75} />} title="No assignments set">
              Set one above. Students see it with its due date, and their departure board counts down to it.
            </EmptyState>
          </div>
        )}
      </Reveal>
    </div>
  );
}

function AssignmentComposer({ code }: { code: string }) {
  const create = useCreateAssignment();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [day, setDay] = useState(() => isoDay(addDays(startOfDay(now()), 7)));
  const [time, setTime] = useState("23:59");
  const [max, setMax] = useState("15");
  const due = useMemo(() => atTime(new Date(`${day}T00:00:00`), time || "23:59"), [day, time]);
  const maxN = Number(max);
  const errors = { due: !day || due <= now() ? "Pick a time in the future" : null, max: !max || Number.isNaN(maxN) || maxN <= 0 || maxN > 100 ? "Between 1 and 100" : null };
  const ok = title.trim() && brief.trim() && !errors.due && !errors.max;
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    create.mutate(
      { code, title: title.trim(), brief: brief.trim(), due, max: maxN },
      {
        onSuccess: () => {
          toast({ title: `Assignment set for ${code}`, description: `Due ${fmt.dayShort(due)}, ${fmt.time(due)}. Students have a notification.` });
          setTitle("");
          setBrief("");
          setOpen(false);
        },
      },
    );
  };
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="panel flex w-full items-center gap-3 px-4 py-3.5 text-left text-[0.9375rem] text-ink-3 transition-colors duration-150 hover:border-line-strong lg:px-5">
        <FilePlus2 size={18} strokeWidth={1.75} className="text-ink-2" aria-hidden />
        Set an assignment for {code}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="panel flex flex-col gap-4 p-4 lg:p-5" aria-label={`New assignment in ${code}`}>
      <div>
        <label htmlFor="a-title" className="field-label">
          Title
        </label>
        <div className="field">
          <input id="a-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment 2: Sequential circuit design" maxLength={160} autoComplete="off" />
        </div>
      </div>
      <div>
        <label htmlFor="a-brief" className="field-label">
          Brief
        </label>
        <textarea id="a-brief" className="field-area" value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="What to do, and what to hand in." maxLength={2000} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="a-day" className="field-label">
            Due date
          </label>
          <div className={cn("field", errors.due && "is-error")}>
            <input id="a-day" type="date" value={day} min={isoDay(now())} onChange={(e) => setDay(e.target.value)} aria-invalid={!!errors.due || undefined} />
          </div>
        </div>
        <div>
          <label htmlFor="a-time" className="field-label">
            Time
          </label>
          <div className="field">
            <input id="a-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="a-max" className="field-label">
            Out of
          </label>
          <div className={cn("field", errors.max && "is-error")}>
            <input id="a-max" type="number" inputMode="numeric" min={1} max={100} value={max} onChange={(e) => setMax(e.target.value)} aria-invalid={!!errors.max || undefined} />
          </div>
        </div>
      </div>
      {errors.due || errors.max ? <p className="-mt-2 text-sm text-danger">{errors.due ?? `Marks: ${errors.max}`}</p> : null}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!ok || create.isPending}>
          {create.isPending ? "Setting…" : "Set assignment"}
        </Button>
      </div>
    </form>
  );
}

/* ─── People ─────────────────────────────────────────────────────────────── */

function PeopleTab({ code }: { code: string }) {
  const { data, isLoading } = useTeachCourse(code);
  const [q, setQ] = useState("");
  const latest = data?.sheets.filter((s) => s.status === "published").at(-1);
  const people = roster.filter((p) => {
    const s = q.trim().toLowerCase();
    return !s || p.name.toLowerCase().includes(s) || p.roll.includes(s);
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-80">
          <label htmlFor="tp-q" className="field-label">
            Find a student
          </label>
          <div className="field h-10">
            <Search size={16} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input id="tp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or roll" autoComplete="off" />
          </div>
        </div>
        <p className="text-sm text-ink-2">
          {plural(roster.length, "student")} · taught by {teacher.name}
          {seed.offeringByCode[code].teacherIds.length > 1 ? " and others" : ""}
        </p>
      </div>
      <Reveal loading={isLoading} skeleton={<Bars rows={8} />}>
        <ScrollX label={`Class list for ${code}`} className="panel">
          <table className="table [&_td]:px-3 [&_th]:px-3 sm:[&_td]:px-4 sm:[&_th]:px-4">
            <thead>
              <tr>
                <th scope="col" className="w-14 sm:w-20">
                  Roll
                </th>
                <th scope="col">Student</th>
                <th scope="col" className="sm:w-[30%]">
                  Attendance
                </th>
                <th scope="col" className="n hidden sm:table-cell">
                  {latest ? `${latest.assessment.name} / ${latest.assessment.max}` : "Latest mark"}
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const att = data?.attendance[p.id];
                const tone = att?.standing === "below" ? "danger" : att?.standing === "watch" ? "caution" : "ok";
                const mark = latest?.scores[p.id];
                return (
                  <tr key={p.id}>
                    <td className="num font-[700] text-ink [font-stretch:84%]">{rollSuffix(p)}</td>
                    <th scope="row" className="font-normal">
                      <Link to={`/teach/students/${p.id}`} className="font-[600] text-ink no-underline hover:underline">
                        {p.name}
                      </Link>
                      {p.regType === "Retake" ? <Tag className="ml-2">Retake</Tag> : null}
                      {p.id === "me" ? <span className="ml-2 text-xs text-ink-3">sample student</span> : null}
                    </th>
                    <td>
                      {att ? (
                        <span className="flex items-center gap-3">
                          <Meter value={att.pct} max={100} line={seed.ATTENDANCE_LINE} tone={tone} label={`${firstName(p.name)}: ${pct(att.pct, 1)}`} className="hidden flex-1 sm:block" />
                          <span className={cn("num w-12 text-right font-[620]", tone === "danger" ? "text-danger" : "text-ink")}>{pct(att.pct)}</span>
                        </span>
                      ) : null}
                    </td>
                    <td className="n hidden sm:table-cell">{mark != null ? <span className="font-[620] text-ink">{mark}</span> : latest ? <span className="text-ink-3">Absent</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollX>
      </Reveal>
      <p className="text-xs text-ink-3">
        Names and rolls are synthetic sample data. The roll number is the last three digits of the student ID.
      </p>
    </div>
  );
}

