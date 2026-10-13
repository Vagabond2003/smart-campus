import type { ComponentType } from "react";
import { createBrowserRouter, Navigate, Outlet, useRouteError, isRouteErrorResponse } from "react-router";
import { RequireAuth } from "./auth";
import { AppShell } from "../shell/AppShell";
import { Button } from "../components/Button";
import { Scene } from "../components/Scenes";

const page = (load: () => Promise<{ default: ComponentType }>) => () => load().then((m) => ({ Component: m.default }));

function RouteError() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <Scene name={notFound ? "end" : "fault"} />
      <h1 className="text-xl font-[680] text-ink">{notFound ? "End of the line: this page isn't on the routine" : "This page hit an error"}</h1>
      <p className="mt-2 text-sm text-ink-2">{notFound ? "The address may be mistyped, or the page has moved." : "Something on this page broke down. Reload it; if it keeps happening, the module may be temporarily unavailable."}</p>
      <Button asChild className="mt-6">
        <a href="/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  );
}

/** First paint while the first route loads: the platform's green when the landing intro is due. */
function BootFallback() {
  const landing = document.documentElement.hasAttribute("data-landing");
  return <div className={landing ? "min-h-dvh bg-rail" : "min-h-dvh bg-ground"} aria-busy="true" />;
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <BootFallback />,
    children: [
      { index: true, lazy: page(() => import("../pages/Welcome")) },
      { path: "/login", lazy: page(() => import("../pages/Login")) },
      { path: "/forgot-password", lazy: page(() => import("../pages/ForgotPassword")) },
      { path: "/activate", lazy: page(() => import("../pages/Activate")) },
      {
        element: (
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        ),
        children: [
          { path: "/dashboard", lazy: page(() => import("../pages/Dashboard")) },
          { path: "/profile", lazy: page(() => import("../pages/Profile")) },
          { path: "/registration/regular", lazy: page(() => import("../pages/RegularRegistration")) },
          { path: "/registration/rib", lazy: page(() => import("../pages/RibRegistration")) },
          { path: "/courses", lazy: page(() => import("../pages/RunningCourses")) },
          {
            path: "/courses/:slug",
            lazy: page(() => import("../pages/course/CourseLayout")),
            children: [
              { index: true, element: <Navigate to="discussion" replace /> },
              { path: ":tab", lazy: page(() => import("../pages/course/CourseTab")) },
            ],
          },
          { path: "/attendance", lazy: page(() => import("../pages/AttendanceSummary")) },
          { path: "/results", lazy: page(() => import("../pages/Results")) },
          { path: "/routine", lazy: page(() => import("../pages/ClassRoutine")) },
          { path: "/bills", lazy: page(() => import("../pages/Bills")) },
          { path: "/bills/receipts/:id", lazy: page(() => import("../pages/Receipt")) },
          { path: "/admit-card", lazy: page(() => import("../pages/AdmitCard")) },
          { path: "/exams", lazy: page(() => import("../pages/ExamRoutine")) },

          // The teacher's side of the sandbox
          { path: "/teach", lazy: page(() => import("../pages/teach/TeachDashboard")) },
          { path: "/teach/courses", lazy: page(() => import("../pages/teach/TeachCourses")) },
          { path: "/teach/courses/:slug/marks/:name", lazy: page(() => import("../pages/teach/MarkSheetPage")) },
          { path: "/teach/courses/:slug/assignments/:id", lazy: page(() => import("../pages/teach/GradeAssignment")) },
          {
            path: "/teach/courses/:slug",
            lazy: page(() => import("../pages/teach/TeachCourseLayout")),
            children: [
              { index: true, element: <Navigate to="roll" replace /> },
              { path: ":tab", lazy: page(() => import("../pages/teach/TeachCourseTab")) },
            ],
          },
          { path: "/teach/roll/:key", lazy: page(() => import("../pages/teach/TakeRoll")) },
          { path: "/teach/routine", lazy: page(() => import("../pages/teach/TeachRoutine")) },
          { path: "/teach/advising", lazy: page(() => import("../pages/teach/Advising")) },
          { path: "/teach/approvals", lazy: page(() => import("../pages/teach/Approvals")) },
          { path: "/teach/students/:id", lazy: page(() => import("../pages/teach/AdviseeRecord")) },
          { path: "*", element: <NotFound /> },
        ],
      },
      { path: "*", element: <Outlet /> },
    ],
  },
]);

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center text-center">
      <Scene name="end" />
      <h1 className="text-xl font-[680] text-ink">End of the line: this page isn't on the routine</h1>
      <p className="mt-2 text-sm text-ink-2">The address may be mistyped, or the page has moved. Every module is in the menu.</p>
      <Button asChild className="mt-6">
        <a href="/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  );
}
