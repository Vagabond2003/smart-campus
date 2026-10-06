import { Navigate, Outlet, useParams } from "react-router";
import * as seed from "../../data/seed";
import { credits } from "../../lib/format";
import { useTitle } from "../../lib/useTitle";
import { Avatar, PageHeader } from "../../components/Data";
import { RouteTabs } from "../../components/Tabs";

export const COURSE_TABS = [
  { key: "discussion", label: "Discussion" },
  { key: "assessments", label: "Assessments" },
  { key: "attendance", label: "Attendance" },
  { key: "lectures", label: "Lectures" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "people", label: "People" },
] as const;

export default function CourseLayout() {
  const { slug = "", tab = "discussion" } = useParams();
  const o = seed.offeringBySlug[slug];
  useTitle(o ? `${o.code} ${o.title}` : "Course");
  if (!o) return <Navigate to="/courses" replace />;
  const teachers = o.teacherIds.map((id) => seed.teachers[id]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Running Courses", to: "/courses" }, { label: o.code }]}
        title={o.title}
        description={
          <>
            <span className="font-[620] text-ink">{o.code}</span> · {o.type} · {credits(o.credit)} credits · Section {o.section} · {seed.student.syllabus}
          </>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <span className="flex -space-x-1.5">
              {teachers.map((t) => (
                <Avatar key={t.id} name={t.name} size="md" className="ring-2 ring-ground" />
              ))}
            </span>
            <span className="text-sm leading-tight">
              {teachers.map((t) => (
                <span key={t.id} className="block">
                  <span className="font-[620] text-ink">{t.name}</span> <span className="text-ink-3">{t.designation}</span>
                </span>
              ))}
            </span>
          </div>
        }
      />
      <div className="-mx-4 mb-6 border-b border-line px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <RouteTabs label="Course sections" activeKey={tab} tabs={COURSE_TABS.map((t) => ({ to: `/courses/${slug}/${t.key}`, label: t.label }))} />
      </div>
      <Outlet />
    </>
  );
}
