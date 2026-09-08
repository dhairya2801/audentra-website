import {
  safeSnapshot,
  formAnalytics,
  botPattern,
} from "@/lib/analytics/collection";
import { after } from "next/server";
import { randomUUID } from "node:crypto";

const CONTACT_EMAIL = "hello@audentra.ai";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readField(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readLine(formData: FormData, name: string, maxLength: number) {
  return readField(formData, name, maxLength).replace(/\s+/g, " ");
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (process.env.AUDENTRA_APP === "analytics")
    return new Response(null, { status: 404 });
  if (!sameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Invalid form submission." },
      { status: 400 },
    );
  }

  // Bots commonly fill fields hidden from people. Return a normal response so
  // they do not learn how the filter works.
  if (readField(formData, "website", 200)) {
    return Response.json({ ok: true });
  }

  const source = readLine(formData, "source", 32);
  if (!["newsletter", "product-walkthrough"].includes(source))
    return Response.json({ error: "Invalid form." }, { status: 400 });
  const email = readLine(formData, "email", 254).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json(
      { error: "Enter a valid work email address." },
      { status: 400 },
    );
  }

  const firstName = readLine(formData, "firstName", 80);
  const lastName = readLine(formData, "lastName", 80);
  const institution = readLine(formData, "institution", 160);
  const title = readLine(formData, "title", 120);
  const interest = readLine(formData, "interest", 80);
  const goal = readField(formData, "goal", 2000);
  const pilot = formData.get("pilot") === "on";

  if (source !== "newsletter" && (!firstName || !lastName || !institution)) {
    return Response.json(
      { error: "Complete all required fields." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("Contact form email is not configured.");
    return Response.json(
      { error: `Email us directly at ${CONTACT_EMAIL}.` },
      { status: 503 },
    );
  }

  const isNewsletter = source === "newsletter";
  const subject = isNewsletter
    ? "New Audentra newsletter request"
    : `New Audentra pilot request from ${firstName} ${lastName}`;
  let attributionText = "";
  try {
    const raw = readField(formData, "attribution", 1000);
    if (raw)
      attributionText =
        "\n\nOutreach attribution (link context, not identity):\n" +
        Object.entries(safeSnapshot(JSON.parse(raw)))
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
  } catch {
    /* Optional attribution must never prevent delivery. */
  }
  const submissionId = readLine(formData, "submissionId", 36);
  const validId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      submissionId,
    );
  const text = isNewsletter
    ? [`Newsletter request`, `Email: ${email}`].join("\n")
    : [
        "Pilot request",
        `Name: ${firstName} ${lastName}`,
        `Work email: ${email}`,
        `Institution: ${institution}`,
        `Job title: ${title || "Not provided"}`,
        `Primary interest: ${interest || "Not provided"}`,
        `Interested in a pilot: ${pilot ? "Yes" : "No"}`,
        "",
        "What they would like to improve:",
        goal || "Not provided",
      ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(validId ? { "Idempotency-Key": `contact-${submissionId}` } : {}),
      },
      body: JSON.stringify({
        from,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject,
        text: text + attributionText,
      }),
    });

    if (!response.ok) {
      console.error(
        "Contact form email delivery failed with status",
        response.status,
      );
      return Response.json(
        {
          error: `We could not send your request. Email us at ${CONTACT_EMAIL}.`,
        },
        { status: 502 },
      );
    }
  } catch {
    console.error("Contact form email delivery failed.");
    return Response.json(
      {
        error: `We could not send your request. Email us at ${CONTACT_EMAIL}.`,
      },
      { status: 502 },
    );
  }

  // The accepted provider response is the conversion authority. Analytics stays
  // outside the delivery response, receives no form values, and honors opt-out.
  try {
    const context = formAnalytics(
      JSON.parse(readField(formData, "analytics", 1200) || "null"),
    );
    if (
      context &&
      request.headers.get("dnt") !== "1" &&
      request.headers.get("sec-gpc") !== "1" &&
      !botPattern.test(request.headers.get("user-agent") || "")
    ) {
      after(async () => {
        try {
          const { recordEvent } = await import("@/lib/analytics/ledger");
          await recordEvent({
            ...context,
            event_name: isNewsletter
              ? "newsletter_submitted"
              : "demo_submitted",
            page: context.page || (isNewsletter ? "/" : "/demo"),
            detail: "none",
            submission_id: validId ? submissionId : randomUUID(),
          });
        } catch {
          console.error("Accepted contact analytics could not be recorded.");
        }
      });
    }
  } catch {
    /* Optional analytics must not affect an accepted contact request. */
  }
  return Response.json({ ok: true, accepted: true });
}
