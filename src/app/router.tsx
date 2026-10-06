import type { ComponentType } from "react";
import { createBrowserRouter, Navigate, Outlet, useRouteError, isRouteErrorResponse } from "react-router";
import { RequireAuth } from "./auth";
import { AppShell } from "../shell/AppShell";
import { Button } from "../components/Button";

const page = (load: () => Promise<{ default: ComponentType }>) => () => load().then((m) => ({ Component: m.default }));

function RouteError() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-[680] text-ink">{notFound ? "This page isn't on the routine" : "This page hit an error"}</h1>
      <p className="mt-2 text-sm text-ink-2">{notFound ? "The address may be mistyped, or the page has moved." : "Reload the page. If it keeps happening, the module may be temporarily unavailable."}</p>
      <Button asChild className="mt-6">
        <a href="/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <div className="min-h-dvh bg-ground" aria-busy="true" />,
    children: [
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
          { index: true, element: <Navigate to="/dashboard" replace /> },
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
      <h1 className="text-xl font-[680] text-ink">This page isn't on the routine</h1>
      <p className="mt-2 text-sm text-ink-2">The address may be mistyped, or the page has moved. Every module is in the menu.</p>
      <Button asChild className="mt-6">
        <a href="/dashboard">Go to Dashboard</a>
      </Button>
    </div>
  );
}
