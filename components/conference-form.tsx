"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { analyticsForForm, emit } from "@/lib/analytics/client";
import { leadContextForForm } from "@/lib/contact/client";
import { processingConsent } from "@/lib/contact/model-copy";
import { offers, type ConferenceOffer } from "@/lib/conference/config";
import { ArrowRight, Check } from "./icons";

export function ConferenceForm({ offer }: { offer: ConferenceOffer }) {
  const [state, setState] = useState<"idle" | "saving" | "accepted" | "error">(
    "idle",
  );
  const [error, setError] = useState("");
  const id = useRef<string | null>(null);
  const busy = useRef(false);
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state === "accepted") confirmation.current?.focus();
  }, [state]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || state === "accepted") return;
    busy.current = true;
    const body = new FormData(event.currentTarget);
    body.set("submissionId", (id.current ||= crypto.randomUUID()));
    body.set("leadContext", leadContextForForm());
    body.set("analytics", analyticsForForm());
    setError("");
    setState("saving");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body,
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || !result.accepted)
        throw new Error(
          result.error ||
            "We couldn’t save your details. Please try again, or stop by the booth and we’ll help.",
        );
      setState("accepted");
      emit("conference_submitted");
    } catch (error) {
      setState("error");
      setError(
        error instanceof Error &&
          error.name !== "TimeoutError" &&
          error.name !== "TypeError"
          ? error.message
          : "The connection dropped before we could confirm. Try again below — we’ll avoid saving the same signup twice. You can also visit the booth for help.",
      );
      emit("form_error", "conference");
    } finally {
      busy.current = false;
    }
  }
  if (state === "accepted")
    return (
      <div
        className="conference-confirmation"
        ref={confirmation}
        tabIndex={-1}
        role="status"
      >
        <span className="conference-check">
          <Check size={26} />
        </span>
        <p className="conference-kicker">
          A little break. A good conversation.
        </p>
        <h2>You’re all set!</h2>
        <p>
          Show this screen at the Audentra booth to collect{" "}
          {offers[offer].collection}.
        </p>
        <div className="conference-saved">
          Your details are safely saved for our team. You can visit the booth
          now.
        </div>
        <p className="conference-small">
          Ask our team what’s available when you arrive.
        </p>
      </div>
    );
  return (
    <form
      className="conference-form"
      onSubmit={submit}
      data-clarity-mask="true"
      data-hs-do-not-collect="true"
      onChange={() => {
        if (!busy.current) id.current = null;
        emit("conference_started");
      }}
    >
      <input type="hidden" name="source" value="conference" />
      <div className="conference-trap" aria-hidden="true">
        <label>
          Leave this blank
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <fieldset disabled={state === "saving"}>
        <legend className="conference-sr">Your details</legend>
        <div className="conference-name-row">
          <label htmlFor="conference-first">
            First name
            <input
              id="conference-first"
              name="firstName"
              autoComplete="given-name"
              required
              maxLength={80}
              enterKeyHint="next"
            />
          </label>
          <label htmlFor="conference-last">
            Last name
            <input
              id="conference-last"
              name="lastName"
              autoComplete="family-name"
              required
              maxLength={80}
              enterKeyHint="next"
            />
          </label>
        </div>
        <label htmlFor="conference-email">
          Work email
          <input
            id="conference-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            enterKeyHint="next"
          />
        </label>
        <label htmlFor="conference-institution">
          Institution / organization
          <input
            id="conference-institution"
            name="institution"
            autoComplete="organization"
            required
            maxLength={160}
            enterKeyHint="done"
          />
        </label>
        <label className="conference-demo">
          <input type="checkbox" name="demoRequested" />
          <span>
            I’d like a demo of Audentra.
            <small>Optional. Let’s find a time to connect.</small>
          </span>
        </label>
        <p className="conference-privacy">
          {processingConsent} No marketing signup.{" "}
          <Link href="/legal/privacy" target="_blank" rel="noopener">
            Privacy policy
            <span className="conference-sr"> (opens in a new tab)</span>
          </Link>
          .
        </p>
        {error && (
          <p className="conference-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="conference-submit"
          type="submit"
          aria-busy={state === "saving"}
        >
          {state === "saving" ? "Saving your details…" : offers[offer].button}
          <ArrowRight size={18} />
        </button>
      </fieldset>
      <p className="conference-form-note">
        Then stop by the Audentra booth. We’d love to meet you.
      </p>
    </form>
  );
}
