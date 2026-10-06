import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Flip } from "gsap/Flip";

// Register once, at module load, before any component runs useGSAP.
gsap.registerPlugin(useGSAP, ScrambleTextPlugin, Flip);

export { gsap, useGSAP, Flip };

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Exponential ease-out used for every authored GSAP move (matches --ease-smooth-out in feel). */
export const EASE_OUT = "expo.out";
