"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";

type Attempt = {
  fingerprint: string;
  reference: string;
  files?: string[];
};
const storageKey = "audentra.support.attempt.v2";
const draftKey = "audentra.support.draft.v1";
function retryInstructions(saved: Attempt | null) {
  if (!saved?.files)
    return "If you attached files, select the originals in the same order. Submit again to retry.";
  if (!saved.files.length)
    return "Submit again to retry with the same reference.";
  return (
    "Select the original files in this order, then submit to retry with the same reference: " +
    saved.files.join(", ") +
    "."
  );
}
const fields = ["portal", "email", "subject", "description"] as const;
export function SupportForm({ portal }: { portal: string }) {
  const attempt = useRef<Attempt | null>(null);
  const original = useRef<Record<string, FormDataEntryValue> | null>(null);
  const [editedFingerprint, setEditedFingerprint] = useState("");
  const [ready, setReady] = useState(false);
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
      setMessage(
        "Your unconfirmed report was restored. " +
          retryInstructions(attempt.current),
      );
    } catch {
      /* Storage may be unavailable. */
    } finally {
      setReady(true);
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
    const files = Array.from(
      event.currentTarget.querySelector<HTMLInputElement>("input[type=file]")
        ?.files ?? [],
    );
    function forget() {
      attempt.current = null;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* Memory fallback. */
      }
    }
    try {
      if (
        files.length > 2 ||
        files.reduce((sum, file) => sum + file.size, 0) > 3 * 1024 * 1024 ||
        files.some((file) => !file.size)
      ) {
        setMessage("Choose up to two nonempty files, 3 MiB combined.");
        return;
      }
      const evidence = await Promise.all(
        files.map(async (file) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (let i = 0; i < bytes.length; i += 16384)
            binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
          return { name: file.name, mime: file.type, data: btoa(binary) };
        }),
      );
      const payload = evidence.length ? { ...data, evidence } : data;
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(payload)),
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
          "Your original report may already be saved. Restore its details to retry, or send these edits as a separate report. " +
            retryInstructions(previous),
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
        attempt.current = {
          reference,
          fingerprint,
          files: files.map((file) => file.name),
        };
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
        body: JSON.stringify({ ...payload, reference, checkOnly: false }),
      });
      const result = await response.json();
      if (
        response.status === 400 &&
        (result.state === "invalid" || result.state === "invalid_evidence")
      ) {
        forget();
        original.current = null;
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* Storage may be unavailable. */
        }
        setMessage(
          result.state === "invalid_evidence"
            ? "Check the file format. Choose a PNG, JPEG, WebP, MP4 or WebM file and try again."
            : "Check the fields and submit again.",
        );
        return;
      }
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
      } else if (result.state === "retry") {
        setMessage(
          "Your report could not be saved. Keep this page open and try again.",
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
      data-clarity-mask="true"
      data-hs-do-not-collect="true"
      onChange={() => setEditedFingerprint("")}
      ref={restoreForm}
      inert={!ready}
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
      <label className="au-field au-field--full">
        Attach evidence (optional)
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
          aria-describedby="evidence-help"
        />
        <small id="evidence-help">
          Choose up to two images or short videos, 3 MiB combined. Crop or blur
          student information before attaching files.
        </small>
      </label>
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
                "Original details restored. " +
                  retryInstructions(attempt.current),
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
