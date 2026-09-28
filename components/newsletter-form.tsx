"use client";

import { FormEvent, useRef, useState } from "react";
import {
  attributionForForm,
  analyticsForForm,
  emit,
} from "@/lib/analytics/client";
import { ArrowRight } from "./icons";
import { leadContextForForm } from "@/lib/contact/client";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function NewsletterForm() {
  const submissionId = useRef<string | null>(null);
  const busy = useRef(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || state === "success") return;
    busy.current = true;
    const payload = new FormData(event.currentTarget);
    payload.set("attribution", attributionForForm());
    payload.set("analytics", analyticsForForm());
    payload.set("leadContext", leadContextForForm());
    payload.set("submissionId", (submissionId.current ||= crypto.randomUUID()));
    const form = event.currentTarget;
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json()) as {
        error?: string;
        accepted?: boolean;
        delivery?: string;
      };

      if (!response.ok) throw new Error(result.error);

      form.reset();
      setState("success");
      if (result.accepted) emit("newsletter_submitted");
      setMessage(
        result.delivery === "queued"
          ? "Thanks — your newsletter request is saved and awaiting delivery to our team."
          : "Thanks — we'll keep you posted.",
      );
    } catch (error) {
      setState("error");
      emit("form_error", "newsletter");
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "We could not send your request. Email us at hello@audentra.ai.",
      );
    } finally {
      busy.current = false;
    }
  }

  return (
    <div className="au-newsform-wrap">
      <form
        data-clarity-mask="true"
        data-hs-do-not-collect="true"
        onChange={() => {
          submissionId.current = null;
          emit("newsletter_started");
        }}
        className="au-newsform"
        action="/api/contact"
        method="post"
        onSubmit={submit}
      >
        <input type="hidden" name="source" value="newsletter" />
        <div className="au-honeypot" aria-hidden="true">
          <label htmlFor="newsletter-website">Website</label>
          <input
            id="newsletter-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <label htmlFor="footer-email" className="au-sr">
          Work email
        </label>
        <input
          id="footer-email"
          name="email"
          type="email"
          placeholder="Work email address"
          autoComplete="email"
          required
        />
        <button
          type="submit"
          className="au-btn au-btn--primary"
          aria-label={state === "submitting" ? "Subscribing" : "Subscribe"}
          disabled={state === "submitting"}
        >
          <ArrowRight />
        </button>
      </form>
      {message ? (
        <p
          className={`au-form-message au-form-message--${state}`}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
