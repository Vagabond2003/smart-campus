import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ArrowLeft, UserRound } from "lucide-react";
import { useAuth } from "../app/auth";
import { cn } from "../lib/cn";
import { useTitle } from "../lib/useTitle";
import { Button } from "../components/Button";
import { SuccessCheck } from "../components/Feedback";
import { AuthFrame } from "./AuthFrame";

export default function ForgotPassword() {
  useTitle("Reset password");
  const { mode } = useAuth();
  const [id, setId] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (id.replace(/\s+/g, "").length !== 16) {
      setError("Student IDs have 16 digits. Check the number on your ID card.");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    setBusy(false);
    setSent(true);
  };

  const back = (
    <Link to="/login" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-[560] text-ink-2 no-underline hover:text-ink">
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
      Back to sign in
    </Link>
  );

  // Activated accounts sign in with a student ID and have no mailbox, so there's nowhere to send a link.
  if (mode === "firebase") {
    return (
      <AuthFrame>
        {back}
        <h1 className="mt-8 text-2xl font-[700] tracking-[-0.02em] text-ink">Forgot your password?</h1>
        <p className="mt-2 text-[0.9375rem] text-ink-2">
          Accounts on this concept use a student ID instead of an email address, so there's no inbox to send a reset link to. The real portal would send it to the phone and email on your student record.
        </p>
        <p className="mt-3 text-[0.9375rem] text-ink-2">To carry on, activate another 16-digit ID, or sign in with the sample account.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/activate">Activate another ID</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/login">Return to sign in</Link>
          </Button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      {back}

      {sent ? (
        <div className="mt-8" role="status">
          <SuccessCheck show />
          <h1 className="mt-4 text-2xl font-[700] tracking-[-0.02em] text-ink">Check your phone</h1>
          <p className="mt-2 text-[0.9375rem] text-ink-2">
            If <span className="num font-[600] text-ink">{id}</span> is registered, a reset link is on its way to the phone number and email on your student record. The link works for 30 minutes.
          </p>
          <p className="mt-4 text-sm text-ink-3">This is a concept build, so no message is actually sent.</p>
          <Button asChild variant="secondary" className="mt-8">
            <Link to="/login">Return to sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          <h1 className="mt-8 text-2xl font-[700] tracking-[-0.02em] text-ink">Reset your password</h1>
          <p className="mt-1.5 text-[0.9375rem] text-ink-2">Enter your student ID. We'll send a reset link to the phone and email on your record.</p>
          <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="rid" className="field-label">
                Student ID
              </label>
              <div className={cn("field", error && "is-error")}>
                <UserRound size={18} strokeWidth={1.75} className="shrink-0 text-ink-3" aria-hidden />
                <input
                  id="rid"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="16-digit ID"
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    setError("");
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? "rid-error" : undefined}
                  className="num"
                />
              </div>
              {error ? (
                <p id="rid-error" role="alert" className="mt-1.5 text-sm text-danger">
                  {error}
                </p>
              ) : null}
            </div>
            <Button type="submit" size="lg" disabled={busy} className="w-full">
              {busy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}
    </AuthFrame>
  );
}
