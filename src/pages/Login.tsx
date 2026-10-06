import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { Eye, EyeOff, KeyRound, UserRound } from "lucide-react";
import { useAuth, type SignInError } from "../app/auth";
import { SAMPLE_PASSWORD, SAMPLE_STUDENT } from "../data/seed";
import { cn } from "../lib/cn";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { AuthFrame } from "./AuthFrame";

type Field = "id" | "password";

function failure(reason: SignInError, mode: "firebase" | "local"): [Field, string] {
  switch (reason) {
    case "id":
      return ["id", mode === "firebase" ? "Student IDs have 16 digits. Check the number on your ID card." : "No student matches that ID. Check the 16 digits on your ID card."];
    case "password":
      return ["password", "That password doesn't match this ID. Try again, or reset it."];
    case "credentials":
      return ["password", "That ID and password don't match an activated account. Check both, or activate the ID first."];
    case "rate":
      return ["password", "Too many attempts. Wait a minute, then try again."];
    case "network":
      return ["password", "Can't reach the sign-in service. Check your connection and try again."];
    case "disabled":
      return ["password", "Sign-in isn't available for this account right now."];
    default:
      return ["password", "Something went wrong signing in. Try again."];
  }
}

export default function Login() {
  useTitle("Sign in");
  const { mode, signedIn, signIn } = useAuth();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: Field; message: string } | null>(null);
  const idBox = useRef<HTMLDivElement>(null);
  const pwBox = useRef<HTMLDivElement>(null);
  const idInput = useRef<HTMLInputElement>(null);
  const pwInput = useRef<HTMLInputElement>(null);

  if (signedIn) return <Navigate to={next} replace />;

  const shake = (field: Field) => {
    const el = field === "id" ? idBox.current : pwBox.current;
    if (!el) return;
    el.classList.remove("is-shaking");
    void el.offsetWidth;
    el.classList.add("is-shaking");
    window.setTimeout(() => el.classList.remove("is-shaking"), 300);
  };

  const fail = (field: Field, message: string) => {
    setError({ field, message });
    shake(field);
    (field === "id" ? idInput : pwInput).current?.focus();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id.trim()) return fail("id", "Enter your 16-digit student ID.");
    if (!password) return fail("password", "Enter your password.");
    setBusy(true);
    const res = await signIn(id, password);
    // On success the auth provider flips signedIn and the redirect above takes over.
    if (res.ok) return;
    setBusy(false);
    const [field, message] = failure(res.reason, mode);
    fail(field, message);
  };

  const clearError = (field: Field) => {
    if (error?.field === field) setError(null);
  };

  return (
    <AuthFrame>
      <h1 className="text-2xl font-[700] tracking-[-0.02em] text-ink">Sign in</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-2">
        {mode === "firebase" ? "Use the ID and password you set up on this concept site, not your BAUST portal password." : "This copy runs on sample data. Sign in with the sample account below."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <div className={cn("t-input-wrap", error?.field === "id" && "is-error")}>
          <label htmlFor="sid" className="field-label">
            Student ID
          </label>
          <div ref={idBox} className={cn("field t-input", error?.field === "id" && "is-error")}>
            <UserRound size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input
              ref={idInput}
              id="sid"
              name="username"
              inputMode="numeric"
              autoComplete="username"
              placeholder="16-digit ID"
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                clearError("id");
              }}
              aria-invalid={error?.field === "id"}
              aria-describedby={error?.field === "id" ? "sid-error" : undefined}
              className="num tracking-[0.02em]"
            />
          </div>
          <p id="sid-error" role="alert" className="t-error-msg mt-1.5 min-h-5 text-sm text-danger">
            {error?.field === "id" ? error.message : ""}
          </p>
        </div>

        <div className={cn("t-input-wrap -mt-3", error?.field === "password" && "is-error")}>
          <div className="flex items-baseline justify-between">
            <label htmlFor="pw" className="field-label">
              Password
            </label>
            <Link to="/forgot-password" className="rounded-sm text-sm font-[560] text-link no-underline hover:underline">
              Forgot password?
            </Link>
          </div>
          <div ref={pwBox} className={cn("field t-input pr-1", error?.field === "password" && "is-error")}>
            <KeyRound size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input
              ref={pwInput}
              id="pw"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={error?.field === "password"}
              aria-describedby={error?.field === "password" ? "pw-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="grid size-9 shrink-0 place-items-center rounded-md text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              {show ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
            </button>
          </div>
          <p id="pw-error" role="alert" className="t-error-msg mt-1.5 min-h-5 text-sm text-danger">
            {error?.field === "password" ? error.message : ""}
          </p>
        </div>

        <Button type="submit" size="lg" disabled={busy} className="-mt-2 w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {mode === "firebase" ? (
        <p className="mt-5 text-center text-sm text-ink-2">
          First time here?{" "}
          <Link to="/activate" className="rounded-sm font-[600] text-link no-underline hover:underline">
            Activate your account
          </Link>
        </p>
      ) : null}

      <div className="mt-8 rounded-lg bg-surface-2 p-4">
        <p className="text-sm font-[620] text-ink">Sample account for this concept</p>
        <p className="mt-1 text-sm text-ink-2">
          ID <span className="num font-[600] text-ink">{SAMPLE_STUDENT.id}</span> · password <span className="font-[600] text-ink">{SAMPLE_PASSWORD}</span>
        </p>
        {mode === "firebase" ? <p className="mt-1 text-sm text-ink-2">It opens a private copy for you. What you change stays in this browser until you sign out.</p> : null}
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            setId(SAMPLE_STUDENT.id);
            setPassword(SAMPLE_PASSWORD);
            setError(null);
          }}
        >
          Use sample account
        </Button>
      </div>

      <p className="mt-8 text-center text-xs text-ink-3 lg:hidden">Discipline · Knowledge · Morality</p>
    </AuthFrame>
  );
}
