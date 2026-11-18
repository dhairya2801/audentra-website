"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";

type Attempt = {
  fingerprint: string;
  reference: string;
};
const storageKey = "audentra.support.attempt.v2";
const draftKey = "audentra.support.draft.v1";
const fields = ["portal", "email", "subject", "description"] as const;
export function SupportForm({ portal }: { portal: string }) {
  const attempt = useRef<Attempt | null>(null);
  const original = useRef<Record<string, FormDataEntryValue> | null>(null);
  const [editedFingerprint, setEditedFingerprint] = useState("");
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [message, setMessage] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const restoreForm = useCallback((element: HTMLFormElement | null) => {
    form.current = element;
    if (!element) return;
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (!draft || !form.current) return;
      attempt.current = JSON.parse(
        sessionStorage.getItem(storageKey) || "null",
      );
      original.current = draft;
      for (const name of fields) {
        const field = form.current.elements.namedItem(name);
        if (
          (field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement) &&
          typeof draft[name] === "string"
        )
          field.value = draft[name];
      }
      setMessage("Your unconfirmed report was restored. Submit to continue.");
    } catch {
      /* Storage may be unavailable. */
    }
  }, []);
  function downloadCopy() {
    if (!form.current) return;
    const data = Object.fromEntries(new FormData(form.current));
    const text = JSON.stringify(
      { ...data, reference: attempt.current?.reference, status: "unconfirmed" },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "audentra-support-report.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const sendEdited =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "new-report";
    submitting.current = true;
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    function forget() {
      attempt.current = null;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* Memory fallback. */
      }
    }
    try {
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(data)),
      );
      const fingerprint = Array.from(new Uint8Array(digest), (v) =>
        v.toString(16).padStart(2, "0"),
      ).join("");
      if (!attempt.current) {
        try {
          attempt.current = JSON.parse(
            sessionStorage.getItem(storageKey) || "null",
          );
        } catch {
          /* Memory fallback. */
        }
      }
      const previous = attempt.current;
      const sameReport = previous?.fingerprint === fingerprint;
      if (
        previous &&
        !sameReport &&
        !(sendEdited && editedFingerprint === fingerprint)
      ) {
        setEditedFingerprint(fingerprint);
        setMessage(
          "Your original report may already be saved. Restore it to retry with the same reference, or send these edits as a separate report.",
        );
        return;
      }
      setEditedFingerprint("");
      original.current = data;
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(data));
      } catch {
        /* The form still holds the report. */
      }
      const reference = sameReport ? previous.reference : crypto.randomUUID();
      function remember() {
        attempt.current = { reference, fingerprint };
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(attempt.current));
        } catch {
          /* Memory fallback. */
        }
      }
      remember();
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, reference, checkOnly: false }),
      });
      const result = await response.json();
      if (
        response.ok &&
        ((result.state === "received" && result.key) ||
          (result.state === "queued" && result.reference === reference))
      ) {
        forget();
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* Storage may be unavailable. */
        }
        setReceipt(result.key || reference);
      } else if (result.state === "conflict") {
        forget();
        setMessage(
          "This reference belongs to different details. Review this report and submit again to get a new reference.",
        );
      } else if (result.state === "limited") {
        setMessage(
          "Too many reports from this network. Please try again in ten minutes.",
        );
      } else if (result.state === "retry" || result.state === "invalid") {
        setMessage(
          result.state === "invalid"
            ? "Check the fields and submit again."
            : "Your report could not be saved. Keep this page open and try again.",
        );
      } else throw Error();
    } catch {
      setMessage(
        "We could not confirm receipt. Submit the same details again to check. Your reference is " +
          (attempt.current?.reference || "unavailable") +
          ".",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <div className="au-card" role="status">
        <h2 className="au-h3">Report received</h2>
        <p>
          Your support reference is <strong>{receipt}</strong>.
          {receipt.includes("-") && receipt.length === 36
            ? " Your report is saved for delivery to Jira."
            : ""}
        </p>
      </div>
    );
  return (
    <form
      onChange={() => setEditedFingerprint("")}
      ref={restoreForm}
      className="au-card"
      onSubmit={submit}
    >
      <h2 className="au-h3">Report an issue</h2>
      <div className="au-form">
        <label className="au-field">
          Portal
          <select
            name="portal"
            defaultValue={
              ["admin-it", "student", "staff"].includes(portal) ? portal : ""
            }
            required
          >
            <option value="" disabled>
              Select your portal
            </option>
            <option value="admin-it">Admin / IT</option>
            <option value="staff">Staff</option>
            <option value="student">Student</option>
          </select>
        </label>
        <label className="au-field">
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className="au-field au-field--full">
          Issue summary
          <input name="subject" maxLength={160} required />
        </label>
        <label className="au-field au-field--full">
          Details
          <textarea name="description" rows={5} maxLength={5000} required />
        </label>
      </div>
      <p className="au-form-note">Leave out passwords and student records.</p>
      {message && (
        <p role="alert" className="au-form-message au-form-message--error">
          {message}
        </p>
      )}
      {message && (
        <button type="button" className="au-btn" onClick={downloadCopy}>
          Save a copy of this report
        </button>
      )}
      <button
        hidden={Boolean(editedFingerprint)}
        className="au-btn au-btn--primary"
        disabled={busy}
      >
        {busy ? "Submitting…" : "Submit report"}
      </button>
      {editedFingerprint && (
        <>
          <button
            type="button"
            className="au-btn"
            disabled={busy}
            onClick={() => {
              if (!form.current || !original.current) return;
              for (const name of fields) {
                const field = form.current.elements.namedItem(name);
                const value = original.current[name];
                if (
                  (field instanceof HTMLInputElement ||
                    field instanceof HTMLSelectElement ||
                    field instanceof HTMLTextAreaElement) &&
                  typeof value === "string"
                )
                  field.value = value;
              }
              setEditedFingerprint("");
              setMessage(
                "Original details restored. Submit to retry with the same reference.",
              );
            }}
          >
            Restore original report
          </button>
          <button
            type="submit"
            value="new-report"
            className="au-btn au-btn--primary"
            disabled={busy}
          >
            Send edits as a new report
          </button>
        </>
      )}
    </form>
  );
}
