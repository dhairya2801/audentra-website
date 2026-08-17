"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "./icons";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function DemoForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === "success") confirmationRef.current?.focus();
  }, [state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error);

      setState("success");
    } catch (submissionError) {
      setState("error");
      setError(
        submissionError instanceof Error && submissionError.message
          ? submissionError.message
          : "We could not send your request. Email us at hello@audentra.ai.",
      );
    }
  }

  if (state === "success") {
    return (
      <div
        ref={confirmationRef}
        className="au-card"
        style={{ padding: "2.5rem", textAlign: "center", alignItems: "center" }}
        role="status"
        tabIndex={-1}
      >
        <span className="au-icon au-icon--teal" style={{ margin: "0 auto 1.25rem" }}>
          <Check size={22} />
        </span>
        <h2 className="au-h3">Thanks — we&rsquo;ll be in touch.</h2>
        <p className="au-body">
          A member of the Audentra team will follow up within one business day to schedule a
          conversation around your institution&rsquo;s workflows.
        </p>
      </div>
    );
  }

  return (
    <form
      className="au-card"
      style={{ padding: "2rem" }}
      action="/api/contact"
      method="post"
      onSubmit={submit}
    >
      <input type="hidden" name="source" value="product-walkthrough" />
      <div className="au-honeypot" aria-hidden="true">
        <label htmlFor="pilot-website">Website</label>
        <input id="pilot-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="au-form">
        <div className="au-field">
          <label htmlFor="first-name">First name</label>
          <input id="first-name" name="firstName" autoComplete="given-name" required />
        </div>
        <div className="au-field">
          <label htmlFor="last-name">Last name</label>
          <input id="last-name" name="lastName" autoComplete="family-name" required />
        </div>
        <div className="au-field au-field--full">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="au-field">
          <label htmlFor="institution">Institution</label>
          <input id="institution" name="institution" autoComplete="organization" required />
        </div>
        <div className="au-field">
          <label htmlFor="title">Job title</label>
          <input id="title" name="title" autoComplete="organization-title" />
        </div>
        <div className="au-field au-field--full">
          <label htmlFor="interest">Primary area of interest</label>
          <select id="interest" name="interest" defaultValue="enrollment-readiness">
            <option value="enrollment-readiness">Enrollment readiness</option>
            <option value="enrollment-management">Enrollment management</option>
            <option value="admissions">Admissions</option>
            <option value="financial-aid">Financial aid</option>
            <option value="enrollment-operations">Enrollment operations</option>
            <option value="leadership">Institutional leadership</option>
            <option value="student-experience">Student experience</option>
          </select>
        </div>
        <div className="au-field au-field--full">
          <label htmlFor="goal">What would you like to improve?</label>
          <textarea
            id="goal"
            name="goal"
            placeholder="Tell us about the workflow, cohort, or outcome you're focused on."
          />
        </div>
        <label className="au-check" htmlFor="pilot">
          <input id="pilot" name="pilot" type="checkbox" />
          <span>I&rsquo;m interested in discussing an Audentra pilot.</span>
        </label>
      </div>

      <p className="au-form-note">
        By submitting this form, you agree that Audentra may use your information to respond to
        your request. See our <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>

      {state === "error" ? (
        <p className="au-form-message au-form-message--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="au-btn-row">
        <button type="submit" className="au-btn au-btn--primary" disabled={state === "submitting"}>
          {state === "submitting" ? "Sending…" : "Schedule a Walkthrough"}
          <ArrowRight />
        </button>
      </div>
    </form>
  );
}
