import { Link } from "react-router";
import { ClipboardCheck, MessageSquareText } from "lucide-react";
import { useTeachCourse } from "../../api/hooks";
import { roomShort } from "../../api/derive";
import { unanswered } from "../../api/teach";
import * as seed from "../../data/seed";
import { roster, SECTION_LABEL, teachingOfferings, termSessions } from "../../data/campus";
import type { Offering } from "../../data/types";
import { now } from "../../lib/clock";
import { credits, fmt, pct, plural, until } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { Button } from "../../components/Button";
import { Meter, PageHeader, Panel, PanelLink, Signal, Tag } from "../../components/Data";
import { Bars, Reveal } from "../../components/Feedback";
import { cn } from "../../lib/cn";

export default function TeachCourses() {
  useTitle("My Courses");
  return (
    <>
      <PageHeader title="My Courses" description={`${seed.SEMESTER} · ${plural(teachingOfferings.length, "course")} · Section ${SECTION_LABEL}, ${roster.length} students`} />
      <div className="flex flex-col gap-5">
        {teachingOfferings.map((o) => (
          <CourseLedger key={o.code} o={o} />
        ))}
      </div>
    </>
  );
}

const sheetTone = { published: "ok", draft: "caution", awaiting: "danger", upcoming: "neutral" } as const;

function CourseLedger({ o }: { o: Offering }) {
  const { data, isLoading } = useTeachCourse(o.code);
  const at = now();
  const held = data?.meetings.filter((m) => m.roll).length ?? 0;
  const total = termSessions.filter((s) => s.code === o.code).length;
  const rows = data ? Object.values(data.attendance) : [];
  const avg = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : 0;
  const under = rows.filter((r) => r.standing === "below").length;
  const next = termSessions.find((s) => s.code === o.code && s.start > at);
  const due = data?.meetings.find((m) => m.status === "due");
  const replies = unanswered(o.code);
  return (
    <Panel
      id={`course-${o.slug}`}
      title={
        <>
          {o.code} <span className="font-[560] normal-case tracking-normal text-ink-2 [font-stretch:100%]">{o.title}</span>
        </>
      }
      action={<PanelLink to={`/teach/courses/${o.slug}`}>Open course</PanelLink>}
    >
      <Reveal loading={isLoading} skeleton={<Bars rows={2} />}>
        <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          <div className="bg-surface px-4 py-3 lg:px-5">
            <dt className="caps text-ink-3">Meetings</dt>
            <dd className="num text-lg font-[680] text-ink">
              {held} <span className="text-sm font-[500] text-ink-3">of {total}</span>
            </dd>
            <dd className="text-xs text-ink-3">
              {o.type} · {credits(o.credit)} credits
            </dd>
          </div>
          <div className="bg-surface px-4 py-3 lg:px-5">
            <dt className="caps text-ink-3">Class attendance</dt>
            <dd className="num text-lg font-[680] text-ink">{pct(avg)}</dd>
            <dd className="mt-1.5">
              <Meter value={avg} max={100} line={seed.ATTENDANCE_LINE} tone={avg < seed.ATTENDANCE_LINE ? "danger" : "ok"} label={`Class average attendance ${pct(avg)}`} />
            </dd>
          </div>
          <div className="bg-surface px-4 py-3 lg:px-5">
            <dt className="caps text-ink-3">Under the line</dt>
            <dd className={cn("num text-lg font-[680]", under ? "text-danger" : "text-ink")}>{under}</dd>
            <dd className="text-xs text-ink-3">{under ? `of ${roster.length} below ${seed.ATTENDANCE_LINE}%` : "Everyone above it"}</dd>
          </div>
          <div className="bg-surface px-4 py-3 lg:px-5">
            <dt className="caps text-ink-3">Next class</dt>
            <dd className="text-[0.9375rem] font-[620] text-ink">{next ? `${fmt.dayShort(next.start)}, ${fmt.time(next.start)}` : "Term's classes are over"}</dd>
            <dd className="text-xs text-ink-3">{next ? `${next.span > 1 ? next.room : `Room ${roomShort(next.room)}`} · ${until(next.start)}` : ""}</dd>
          </div>
        </dl>
        <div className="border-t border-line px-4 py-3 lg:px-5">
          <p className="caps mb-2 text-ink-3">Assessments</p>
          <ul className="flex flex-wrap gap-2">
            {data?.sheets.map((r) => (
              <li key={r.assessment.name}>
                <Link to={`/teach/courses/${o.slug}/marks/${encodeURIComponent(r.assessment.name)}`} className="inline-flex no-underline">
                  <Signal tone={sheetTone[r.status]} dot={r.status !== "upcoming"}>
                    {r.assessment.name}
                    <span className="font-[500]">
                      {r.status === "published" ? " · published" : r.status === "draft" ? " · draft" : r.status === "awaiting" ? " · awaiting" : r.assessment.date ? ` · ${fmt.short(r.assessment.date)}` : ""}
                    </span>
                  </Signal>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {due || replies ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 lg:px-5">
            {due ? (
              <Button asChild size="sm" variant={due.live ? "primary" : "danger"} icon={<ClipboardCheck size={15} strokeWidth={1.75} />}>
                <Link to={`/teach/roll/${due.key}`}>{due.live ? "Take roll now" : `Take roll for ${fmt.time(due.session.start)}`}</Link>
              </Button>
            ) : null}
            {replies ? (
              <Link to={`/teach/courses/${o.slug}/discussion`} className="flex items-center gap-1.5 text-sm font-[560] text-link no-underline hover:underline">
                <MessageSquareText size={15} strokeWidth={1.75} aria-hidden />
                {plural(replies, "post has", "posts have")} a student question waiting
              </Link>
            ) : null}
            <Tag className="ml-auto">Section {seed.student.section}</Tag>
          </div>
        ) : null}
      </Reveal>
    </Panel>
  );
}
