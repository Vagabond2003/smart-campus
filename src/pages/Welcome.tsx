import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../app/auth";
import { trackEvent } from "../lib/firebase";
import { clearLandingGround, introSeen, markIntroSeen } from "../lib/intro";
import { prefersReducedMotion } from "../lib/motion";
import { Intro, type IntroEnd } from "./intro/Intro";
import Login from "./Login";

/**
 * The site's front door. Signed-out visitors get the arrival once per visit, played over the
 * sign-in page it hands over to; everyone else goes straight to where they were going.
 */
export default function Welcome() {
  const { ready, signedIn } = useAuth();
  const navigate = useNavigate();
  // Decided once, on arrival: a reload or a later visit to "/" in this tab goes straight in.
  const skipIntro = useMemo(() => introSeen() || prefersReducedMotion(), []);
  const [playing, setPlaying] = useState(true);

  const plays = ready && !signedIn && !skipIntro;

  useEffect(() => {
    if (plays) markIntroSeen();
  }, [plays]);

  useEffect(() => {
    if (plays) document.title = "Smart Campus · an unofficial concept";
  }, [plays]);

  useEffect(() => clearLandingGround, []);

  if (ready && signedIn) return <Navigate to="/dashboard" replace />;
  if (skipIntro) return <Navigate to="/login" replace />;
  // Firebase is still restoring the session: hold the platform's first frame.
  if (!ready) return <div className="fixed inset-0 bg-rail" aria-busy="true" />;

  const done = (how: IntroEnd) => {
    trackEvent("intro_end", { how });
    clearLandingGround();
    navigate("/login", { replace: true, state: how === "skipped-key" ? { focus: "sid" } : undefined });
  };

  return (
    <>
      <div data-intro={playing ? "playing" : undefined} inert={playing}>
        <Login />
      </div>
      <Intro onLanded={() => setPlaying(false)} onDone={done} />
    </>
  );
}
