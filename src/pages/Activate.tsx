import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, IdCard, KeyRound, UserRound } from "lucide-react";
import { cleanId, useAuth, type ActivateError } from "../app/auth";
import { SAMPLE_ID_PREFIX } from "../data/seed";
import { cn } from "../lib/cn";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { AuthFrame } from "./AuthFrame";

type Field = "id" | "name" | "password";

const MIN_PASSWORD = 8;

function failure(reason: ActivateError): [Field, string] {
  switch (reason) {
    case "taken":
      return ["id", "This ID is already activated. Sign in with it instead."];
    case "sample":
      return ["id", "That ID belongs to the sample student. Use it from the sign-in page."];
    case "weak":
      return ["password", `Use at least ${MIN_PASSWORD} characters.`];
    case "rate":
      return ["password", "Too many attempts. Wait a minute, then try again."];
    case "network":
      return ["password", "Can't reach the sign-in service. Check your connection and try again."];
    case "disabled":
      return ["password", "Activation is turned off for this concept right now."];
    default:
      return ["password", "Something went wrong activating the account. Try again."];
  }
}

export default function Activate() {
  useTitle("Activate your account");
  const { mode, signedIn, activate } = useAuth();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: Field; message: string } | null>(null);
  const boxes = { id: useRef<HTMLDivElement>(null), name: useRef<HTMLDivElement>(null), password: useRef<HTMLDivElement>(null) };
  const inputs = { id: useRef<HTMLInputElement>(null), name: useRef<HTMLInputElement>(null), password: useRef<HTMLInputElement>(null) };

  if (signedIn) return <Navigate to="/dashboard" replace />;

  if (mode === "local") {
    return (
      <AuthFrame>
        <BackToSignIn />
        <h1 className="mt-8 text-2xl font-[700] tracking-[-0.02em] text-ink">Accounts aren't switched on</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">This copy of the portal runs on sample data only, so there's nothing to activate. Sign in with the sample account instead.</p>
        <Button asChild variant="secondary" className="mt-8">
          <Link to="/login">Return to sign in</Link>
        </Button>
      </AuthFrame>
    );
  }

  const fail = (field: Field, message: string) => {
    setError({ field, message });
    const el = boxes[field].current;
    if (el) {
      el.classList.remove("is-shaking");
      void el.offsetWidth;
      el.classList.add("is-shaking");
      window.setTimeout(() => el.classList.remove("is-shaking"), 300);
    }
    inputs[field].current?.focus();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const sid = cleanId(id);
    if (!/^\d{16}$/.test(sid)) return fail("id", "Enter a 16-digit student ID, digits only.");
    if (sid.startsWith(SAMPLE_ID_PREFIX)) return fail("id", "That ID belongs to the sample student. Use it from the sign-in page.");
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName.length < 2) return fail("name", "Enter your name as it should appear in the portal.");
    if (cleanName.length > 80) return fail("name", "Keep the name under 80 characters.");
    if (password.length < MIN_PASSWORD) return fail("password", `Use at least ${MIN_PASSWORD} characters.`);
    setBusy(true);
    const res = await activate(sid, cleanName, password);
    // On success the auth provider signs the student in and the redirect above takes over.
    if (res.ok) return;
    setBusy(false);
    fail(...failure(res.reason));
  };

  const clearError = (field: Field) => {
    if (error?.field === field) setError(null);
  };

  const errorFor = (field: Field) => (error?.field === field ? error.message : "");

  return (
    <AuthFrame>
      <BackToSignIn />
      <h1 className="mt-8 text-2xl font-[700] tracking-[-0.02em] text-ink">Activate your account</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-2">Choose the password you'll sign in with. Your records are saved to your account from then on.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-2">
        <div className={cn("t-input-wrap", error?.field === "id" && "is-error")}>
          <label htmlFor="aid" className="field-label">
            Student ID
          </label>
          <div ref={boxes.id} className={cn("field t-input", error?.field === "id" && "is-error")}>
            <IdCard size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input
              ref={inputs.id}
              id="aid"
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
              aria-describedby="aid-hint aid-error"
              className="num tracking-[0.02em]"
            />
          </div>
          <p id="aid-hint" className="mt-1.5 text-sm text-ink-3">
            Any 16 digits will do. This is a concept build, so you don't need your real student ID.
          </p>
          <p id="aid-error" role="alert" className="t-error-msg mt-1 min-h-5 text-sm text-danger">
            {errorFor("id")}
          </p>
        </div>

        <div className={cn("t-input-wrap", error?.field === "name" && "is-error")}>
          <label htmlFor="aname" className="field-label">
            Full name
          </label>
          <div ref={boxes.name} className={cn("field t-input", error?.field === "name" && "is-error")}>
            <UserRound size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input
              ref={inputs.name}
              id="aname"
              name="name"
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              aria-invalid={error?.field === "name"}
              aria-describedby="aname-error"
            />
          </div>
          <p id="aname-error" role="alert" className="t-error-msg mt-1.5 min-h-5 text-sm text-danger">
            {errorFor("name")}
          </p>
        </div>

        <div className={cn("t-input-wrap", error?.field === "password" && "is-error")}>
          <label htmlFor="apw" className="field-label">
            Password
          </label>
          <div ref={boxes.password} className={cn("field t-input pr-1", error?.field === "password" && "is-error")}>
            <KeyRound size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
            <input
              ref={inputs.password}
              id="apw"
              name="new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={error?.field === "password"}
              aria-describedby="apw-hint apw-error"
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
          <p id="apw-hint" className="mt-1.5 text-sm text-ink-3">
            At least {MIN_PASSWORD} characters, and not your BAUST portal password. There's no email on these accounts, so keep it somewhere safe.
          </p>
          <p id="apw-error" role="alert" className="t-error-msg mt-1 min-h-5 text-sm text-danger">
            {errorFor("password")}
          </p>
        </div>

        <Button type="submit" size="lg" disabled={busy} className="mt-1 w-full">
          {busy ? "Activating…" : "Activate account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-2">
        Already activated?{" "}
        <Link to="/login" className="rounded-sm font-[600] text-link no-underline hover:underline">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}

function BackToSignIn() {
  return (
    <Link to="/login" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-[560] text-ink-2 no-underline hover:text-ink">
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
      Back to sign in
    </Link>
  );
}
