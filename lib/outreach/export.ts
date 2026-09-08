import ExcelJS from "exceljs";

import { campaignUrl, generalCampaigns } from "@/lib/analytics/schema";
import { referralUrl, safeSpreadsheetCell, type Referral } from "./shared";
export const exportHeaders = [
  "Referral code",
  "Full URL",
  "Contact / person",
  "Organization",
  "Channel",
  "Campaign",
  "Date sent",
  "Status",
  "Notes",
  "Visits",
  "Engaged visits",
  "CTA visits",
  "Demo requests",
  "Newsletter requests",
  "Last visit (UTC)",
  "Last activity (UTC)",
];
export function referralRow(r: Referral) {
  return [
    r.code,
    referralUrl(r.code),
    r.contact_name,
    r.organization,
    r.channel,
    r.campaign,
    r.date_sent,
    r.status,
    r.notes,
    r.visits || 0,
    r.engaged || 0,
    r.cta || 0,
    r.demos || 0,
    r.newsletters || 0,
    r.last_visit,
    r.last_activity,
  ];
}
export function csvExport(referrals: Referral[]) {
  return (
    "\uFEFF" +
    [exportHeaders, ...referrals.map(referralRow)]
      .map((row) =>
        row
          .map((v) => '"' + safeSpreadsheetCell(v).replaceAll('"', '""') + '"')
          .join(","),
      )
      .join("\r\n")
  );
}
export async function xlsxExport(referrals: Referral[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Audentra";
  workbook.title = "Private outreach export";
  function sheet(name: string, headers: string[], widths: number[]) {
    const s = workbook.addWorksheet(name, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    s.columns = headers.map((header, i) => ({
      header,
      width: widths[i] || 23,
    }));
    s.getRow(1).height = 32;
    return s;
  }
  const links = sheet(
    "Referral links",
    exportHeaders,
    [18, 48, 26, 28, 24, 26, 18, 20, 45],
  );
  for (const referral of referrals) {
    const row = links.addRow(
      referralRow(referral).map((v) =>
        typeof v === "number" ? v : safeSpreadsheetCell(v),
      ),
    );
    row.height = 35;
    row.getCell(2).value = {
      text: referralUrl(referral.code),
      hyperlink: referralUrl(referral.code),
    };
  }
  const campaigns = sheet(
    "General campaigns",
    [
      "Channel",
      "Full URL",
      "UTM source",
      "UTM medium",
      "UTM campaign",
      "UTM content",
    ],
    [28, 110, 24, 24, 28, 24],
  );
  for (const c of generalCampaigns)
    campaigns.addRow([
      c.label,
      { text: campaignUrl(c), hyperlink: campaignUrl(c) },
      c.source,
      c.medium,
      c.campaign,
      c.content,
    ]);
  const guide = sheet("How to use", ["Topic", "Instructions"], [28, 115]);
  for (const [topic, instruction] of [
    [
      "Source of truth",
      "Manage links, contacts, organizations, status, and notes in the private analytics.audentra.ai dashboard. This workbook is a point-in-time export, not a synchronization or import mechanism. Editing it does not update the dashboard.",
    ],
    [
      "Public links",
      "Share the opaque Full URL. Channel and campaign are assigned privately in the dashboard, then resolved by the marketing site. Do not append names, emails, organizations, or notes to any URL.",
    ],
    [
      "General campaigns",
      "Use the general links for broad posts and campaigns. All UTM values are approved non-personal categories. Individual referral URLs need only ?r=CODE.",
    ],
    [
      "Keep private",
      "Contact and organization fields, notes, and status are private team records. This export may contain personal information: store it with restricted team access and never commit it or publish it.",
    ],
    [
      "What the metrics mean",
      "Visits are visible JavaScript opens; engaged visits require at least 15 focused/visible seconds plus interaction. Demo and newsletter requests require the contact API to confirm email-provider acceptance. CTA visits count visits with a demo CTA click. All referral metrics are lifetime totals.",
    ],
    [
      "Identity and scanners",
      "Codes identify links and attributed visits, not conclusively the human opening them. Links can be forwarded; sophisticated scanners can generate activity. Blockers and consent may undercount.",
    ],
    [
      "Attribution",
      "The link metadata is captured when a tab visit starts and preserved through internal navigation/forms. A new campaign link or 30 minutes of inactivity starts a new visit. No persistent person or cross-device ID.",
    ],
    [
      "Verify",
      "Open a link in a fresh tab, explore a product, actively read for 15 seconds, and open the demo page. Refresh the private Referral Links table to see first-party activity. Use Vercel custom events or consented Clarity recordings for additional detail.",
    ],
  ]) {
    const row = guide.addRow([topic, instruction]);
    row.height = 65;
  }
  for (const s of workbook.worksheets) {
    s.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: s.rowCount, column: s.columnCount },
    };
    s.eachRow((row, i) =>
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
        if (i === 1) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF254E41" },
          };
        } else if (i % 2 === 0)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F5EB" },
          };
      }),
    );
  }
  return workbook.xlsx.writeBuffer();
}
