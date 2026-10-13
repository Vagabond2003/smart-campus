import { Link, Navigate, Outlet, useParams } from "react-router";
import { Eye } from "lucide-react";
import * as seed from "../../data/seed";
import { roster, SECTION_LABEL, teaches } from "../../data/campus";
import { credits } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { Button } from "../../components/Button";
import { PageHeader } from "../../components/Data";
import { RouteTabs } from "../../components/Tabs";
import { TabMotion } from "../../components/Motion";

export const TEACH_COURSE_TABS = [
  { key: "roll", label: "Roll" },
  { key: "marks", label: "Marks" },
  { key: "discussion", label: "Discussion" },
  { key: "lectures", label: "Lectures" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "people", label: "People" },
] as const;

export default function TeachCourseLayout() {
  const { slug = "", tab = "roll" } = useParams();
  const o = seed.offeringBySlug[slug];
  useTitle(o ? `${o.code} ${o.title}` : "Course");
  if (!o || !teaches(o.code)) return <Navigate to="/teach/courses" replace />;
  return (
    <>
      <PageHeader
        crumbs={[{ label: "My Courses", to: "/teach/courses" }, { label: o.code }]}
        title={o.title}
        description={
          <>
            <span className="font-[620] text-ink">{o.code}</span> · {o.type} · {credits(o.credit)} credits · Section {SECTION_LABEL}, {roster.length} students · {seed.SEMESTER}
          </>
        }
        actions={
          <Button asChild variant="secondary" icon={<Eye size={16} strokeWidth={1.75} />}>
            <Link to={`/courses/${o.slug}/${tab === "roll" ? "attendance" : tab === "marks" ? "assessments" : tab}`}>View as student</Link>
          </Button>
        }
      />
      <div className="-mx-4 mb-6 border-b border-line px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <RouteTabs label="Course sections" activeKey={tab} tabs={TEACH_COURSE_TABS.map((t) => ({ to: `/teach/courses/${slug}/${t.key}`, label: t.label }))} />
      </div>
      <TabMotion tab={tab} order={TEACH_COURSE_TABS.map((t) => t.key)}>
        <Outlet />
      </TabMotion>
    </>
  );
}
