import { isAuthorized } from "@/lib/analytics/access";
import { requestOrigin } from "@/lib/analytics/request-origin";
import {
  createReferral,
  listReferrals,
  updateReferral,
} from "@/lib/outreach/store";
import { validateReferral } from "@/lib/outreach/shared";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  if (!(await isAuthorized()))
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    return Response.json({ referrals: await listReferrals() }, { headers });
  } catch {
    return Response.json(
      {
        error:
          "Outreach database unavailable. Connect DATABASE_URL and run the outreach migration. Your records have not been replaced with local data.",
      },
      { status: 503, headers },
    );
  }
}
async function write(request: Request, editing: boolean) {
  if (!(await isAuthorized()))
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  if (!requestOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  if (Number(request.headers.get("content-length") || 0) > 10000)
    return new Response(null, { status: 413 });
  let body;
  try {
    const text = await request.text();
    if (text.length > 10000) return new Response(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Invalid request" },
      { status: 400, headers },
    );
  }
  const fields = validateReferral(body);
  if (!fields)
    return Response.json(
      { error: "Check the field values and lengths." },
      { status: 400, headers },
    );
  try {
    if (editing) {
      if (
        !/^[a-f0-9]{6,10}$/.test(body.code) ||
        !Number.isInteger(body.version)
      )
        return Response.json(
          { error: "Invalid record" },
          { status: 400, headers },
        );
      if (!(await updateReferral(body.code, body.version, fields)))
        return Response.json(
          {
            error:
              "This record changed since you opened it. Close and refresh before editing again.",
          },
          { status: 409, headers },
        );
      return Response.json({ code: body.code }, { headers });
    }
    return Response.json(
      { code: await createReferral(fields) },
      { status: 201, headers },
    );
  } catch {
    return Response.json(
      {
        error:
          "Could not save the record. The database may be unavailable; your unsaved edits are still here.",
      },
      { status: 503, headers },
    );
  }
}
export async function POST(request: Request) {
  return write(request, false);
}
export async function PATCH(request: Request) {
  return write(request, true);
}
