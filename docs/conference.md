# AACRAO Baltimore conference capture

Status: **live**. Launch offer: **Morning Brew coffee** (user confirmed). Stable page:
https://www.audentra.ai/events/aacrao-baltimore

## Experience and delivery

The focused mobile page uses Audentra typography/colors and a small inline SVG
coffee illustration. It collects first name, last name, email, organization,
and an optional unchecked demo request. Personal email domains are accepted.
No dates, booth number, official partnership, redemption restriction, or
availability guarantee is represented. The screen is a confirmation, not a
one-per-person redemption system.

The existing `/api/contact` endpoint handles source `conference`. Its validation,
honeypot, origin/body/rate checks, immutable Neon records, provider jobs, safe
retries/reconciliation, ownership, Resend notification and daily recovery remain
shared with the working demo integration. Existing demo/newsletter destinations
are unchanged. Success requires durable acceptance; attendee copy says details
are safely saved and they can visit the booth, without claiming CRM delivery.

HubSpot portal **52074694**, form **Audentra — AACRAO Baltimore**, ID
`a59332e1-cddd-4f19-8a22-a18138090dc6`:
[form editor](https://app.hubspot.com/forms/52074694/editor/a59332e1-cddd-4f19-8a22-a18138090dc6/edit/form).
Find submissions in Marketing → Forms → this form → Submissions; contact records
are in CRM → Contacts. The same email attaches to the existing contact.

Dr. Zaibis Muñoz-Isme, `zaibis.munozisme@vekend.com`, active owner ID `159663764`
and notification user ID `159663764`, was reverified from the current Owners API.
The new form notifies that user, with duplicate contact-owner notifications off.
Existing Resend notifications still go to hello@audentra.ai. Coffee-only signups
are clearly labeled; an explicit demo request is highlighted for follow-up.

After inventorying 406 existing properties, three missing properties were added:

| Property | Meaning |
| --- | --- |
| `audentra_latest_event` | Latest event, `AACRAO Baltimore`; prior submissions retain history |
| `audentra_giveaway_interest` | `coffee`, `swag`, or `both` offered at submission |
| `audentra_demo_requested` | Set to `true` only for an explicit request; never sent as false |

Standard name/email/company properties, `audentra_submission_id` and
`audentra_request_attribution` are reused. Attribution includes the event, offer,
and `demo_requested_this_submission` boolean on every event submission. Thus an
unchecked repeat is accurately recorded in submission history without erasing a
previous positive demo request. Conference submissions do not change job title,
primary interest, improvement goal, pilot interest, or original-source fields.
No marketing consent, deal creation, meeting booking, or paid workflow is added.
The conference form disables prepopulation and enables new contacts for new emails.

## Configuration

Existing service key runtime scopes remain only `forms`,
`crm.objects.contacts.read`, and `crm.objects.contacts.write`. Temporary owner
lookup/schema-write scopes were removed after setup. No new secret/service.
Marketing-project environment values:

```dotenv
HUBSPOT_CONFERENCE_FORM_ID=a59332e1-cddd-4f19-8a22-a18138090dc6
HUBSPOT_CONFERENCE_PROPERTY_MAP={"event":"audentra_latest_event","giveaway":"audentra_giveaway_interest","demoRequested":"audentra_demo_requested","submissionId":"audentra_submission_id","attribution":"audentra_request_attribution"}
CONFERENCE_OFFER=coffee
```

`CONFERENCE_OFFER` may be `coffee`, `swag`, or `both`. Change it in Vercel and
redeploy so the page and backend agree. Printed QR codes remain valid.
Conference submissions require durable mode and configured HubSpot delivery;
misconfiguration returns an error instead of accepting an email-only signup.
`npm run contact:migrate` now also applies additive migration 004, allowing the
conference source while retaining all records and job permissions.

## Attribution and privacy

Both QR codes point directly to the production page with nonpersonal campaign
parameters. With allowed analytics, the existing consent-aware context retains
campaign/placement and the real HubSpot cookie if present. Declining or blocking
tracking does not stop form submission. The event and chosen giveaway are
operational submission information, retained regardless of optional tracking.
The first-touch system fields are not mapped or rewritten.

`conference_started` and `conference_submitted` are separate analytics events;
the latter is recorded in the same DB transaction and deduplicated by submission
ID. Browser collectors reject forged conversion events. No coffee signup counts
as `demo_submitted`, even when the optional demo follow-up is selected. That
choice is recorded privately in HubSpot and internal notifications. General
analytics receives no attendee fields. The existing dashboard demo totals keep
their meaning; conference acceptance is available in the ledger and HubSpot form.

## Printable QR files

Files are served under `/events/aacrao-baltimore/`:

- `qr-booth-signage.svg` and `qr-booth-signage.png`
- `qr-handout.svg` and `qr-handout.png`
- `qr-manifest.json`: exact URLs, dimensions and decoding results

Use SVG for print layout; PNG exports are 1560 × 1560 (booth) and 1464 × 1464
(handout), tagged 300 dpi. Both are black on white, use Q error correction and a
four-module quiet zone. Keep them square and retain the white margin. Print at
least 5 cm / 2 inches wide; enlarge for scanning from a distance. Place the
human-readable page URL next to the code. Check a physical proof before printing
in quantity; digital decoding is not a substitute for checking paper/lighting.

Generate reproducibly with `npm run conference:qr`. The script uses `qrcode`,
then independently decodes both PNG and rasterized SVG with `jsqr`, rejecting
any mismatch with the exact intended HTTPS URL. No third-party shortener.

## Verification

Local provider tests use mocks, with real disposable Postgres and the real Next
endpoint. 25 Node tests passed, covering distinct conversion, deduplication,
429/timeouts/reconciliation, slow delivery, optional-demo preservation and offer
configuration. 14 browser tests passed (four conference, four HubSpot, six existing marketing).
Mobile browser checks cover 320/390 px, labels/autocomplete,
16 px inputs, no horizontal overflow, double tap, network retries, blockers,
consent, confirmation focus and normal navigation. Existing demo/newsletter
regression tests remain in the suite. Both SVG/PNG QR variants were decoded.

Real verification, September 28, 2026:

- Preview `dpl_AbxyH57LviwHtnQiP7andZrkMuuj`: submission
  `3ac1aa76-ed41-446f-b172-b6191f03dde2`, demo checked, tracking declined.
  New contact **251657782796**, labeled **AACRAO CONFERENCE TEST DO NOT CONTACT**.
  All mapped fields, Dr. Zaibis ownership, HubSpot submission and Resend acceptance
  verified. Three jobs sent once each. This was an actual preview API test.
- Initial production rollout `dpl_2FfWThXfvsptvfNDD9MKQrie1K1c`:
  mobile browser scanned destination, submission
  `2a20c251-bb53-4ffe-b455-ff7f32ae284e`, same email, demo unchecked, optional
  tracking permitted but third-party scripts blocked. A double tap sent once;
  two concurrent HTTP retries returned the same accepted request. Exactly one
  form submission and one `conference_submitted` ledger event, no demo conversion.
- The actual HubSpot API confirmed the same contact, preserved positive demo
  interest, original source and first conversion, correct current unchecked
  choice in the submission snapshot, coffee offer, QR campaign/booth placement,
  and Dr. Zaibis ownership. All three jobs completed in one attempt.
- Public SVG and PNG files for both placements were fetched and independently
  decoded to the exact manifest URLs after deployment. Mobile browser widths
  320/390 had no overflow or page errors. Confirmation received focus and
  accurately reported saved details. No personal fields entered analytics.
- Real HubSpot tracking emitted exactly one conference pageview after opt-in;
  withdrawal removed its cookie and stopped script loading. The live demo page
  still showed both existing forms and navigation.
- The user confirmed Dr. Zaibis received the new conference-form notification.
  Existing Resend notification acceptance was also verified (provider acceptance,
  not a claim of access to the hello@ inbox).
- Provider outage behavior is mocked; no real provider outage was induced.
  Physical paper/camera testing remains the printer's final proof check.

Test contact: [open in HubSpot](https://app.hubspot.com/contacts/52074694/record/0-1/251657782796).
Source history and later deployments are tracked in the conference pull request.

Recovery uses the existing daily Hobby cron; unresolved or ambiguous jobs may
need operator review. `npm run contact:status` and the existing recovery runbook
in [hubspot.md](hubspot.md) apply unchanged.

## Official references

- [Authenticated Forms Submission API](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-authenticated)
- [Create a form](https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/create-form)
