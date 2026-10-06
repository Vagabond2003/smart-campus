import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Desktop shell (rail + top bar) from 1024px. */
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
/** Phone layouts below 768px. */
export const useIsPhone = () => useMediaQuery("(max-width: 767px)");
