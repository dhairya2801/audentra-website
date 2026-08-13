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
  if (!sameOrigin(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form submission." }, { status: 400 });
  }

  // Bots commonly fill fields hidden from people. Return a normal response so
  // they do not learn how the filter works.
  if (readField(formData, "website", 200)) {
    return Response.json({ ok: true });
  }

  const source = readLine(formData, "source", 32);
  const email = readLine(formData, "email", 254).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: "Enter a valid work email address." }, { status: 400 });
  }

  const firstName = readLine(formData, "firstName", 80);
  const lastName = readLine(formData, "lastName", 80);
  const institution = readLine(formData, "institution", 160);
  const title = readLine(formData, "title", 120);
  const interest = readLine(formData, "interest", 80);
  const goal = readField(formData, "goal", 2000);
  const pilot = formData.get("pilot") === "on";

  if (source !== "newsletter" && (!firstName || !lastName || !institution)) {
    return Response.json({ error: "Complete all required fields." }, { status: 400 });
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
      },
      body: JSON.stringify({
        from,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      console.error("Contact form email delivery failed with status", response.status);
      return Response.json(
        { error: `We could not send your request. Email us at ${CONTACT_EMAIL}.` },
        { status: 502 },
      );
    }
  } catch {
    console.error("Contact form email delivery failed.");
    return Response.json(
      { error: `We could not send your request. Email us at ${CONTACT_EMAIL}.` },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
