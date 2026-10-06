import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./lib/motion";
import "./styles/index.css";
import { router } from "./app/router";
import { AuthProvider } from "./app/auth";
import { DisplayProvider } from "./lib/display";
import { ToastProvider } from "./components/Toast";
import { initAnalytics } from "./lib/firebase";

void initAnalytics();

// A tab opened before a redeploy can ask for a code chunk that no longer exists. Reload to pick up
// the new build, at most once a minute so a real outage can't turn into a reload loop.
window.addEventListener("vite:preloadError", (event) => {
  try {
    if (Date.now() - Number(sessionStorage.getItem("sc.chunk-reload") ?? 0) < 60_000) return;
    sessionStorage.setItem("sc.chunk-reload", String(Date.now()));
  } catch {
    return; // without storage there's no loop guard; the error page offers a reload instead
  }
  event.preventDefault();
  window.location.reload();
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DisplayProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </DisplayProvider>
  </StrictMode>,
);
