"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "./icons";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function NewsletterForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: new FormData(form),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error);

      form.reset();
      setState("success");
      setMessage("Thanks — we'll keep you posted.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "We could not send your request. Email us at hello@audentra.ai.",
      );
    }
  }

  return (
    <div className="au-newsform-wrap">
      <form className="au-newsform" action="/api/contact" method="post" onSubmit={submit}>
        <input type="hidden" name="source" value="newsletter" />
        <div className="au-honeypot" aria-hidden="true">
          <label htmlFor="newsletter-website">Website</label>
          <input id="newsletter-website" name="website" tabIndex={-1} autoComplete="off" />
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
        <p className={`au-form-message au-form-message--${state}`} role={state === "error" ? "alert" : "status"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
