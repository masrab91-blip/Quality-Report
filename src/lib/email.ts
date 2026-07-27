import "server-only";
import { Resend } from "resend";
import type { Report } from "@/generated/prisma/client";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/validation";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MANAGER_EMAIL);
}

// Sent server-side on every submission, PDF attached — no mailto:, no manual
// click (the prototype's biggest gap: a report could sit unreviewed for days
// because nobody happened to click the mail link).
export async function sendSubmissionEmail(report: Report, pdfBuffer: Buffer): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const managerEmail = process.env.MANAGER_EMAIL;
  const fromEmail = process.env.EMAIL_FROM ?? "quality-tracker@beldenae.com";

  if (!apiKey || !managerEmail) {
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to: managerEmail,
    subject: `New quality issue report ${report.reportNumber} — ${report.customer}`,
    html: `
      <p>A new quality issue report was submitted.</p>
      <ul>
        <li><strong>Report:</strong> ${report.reportNumber}</li>
        <li><strong>Customer:</strong> ${report.customer}</li>
        <li><strong>Vendor:</strong> ${report.vendor ?? "—"}</li>
        <li><strong>Defect type:</strong> ${DEFECT_TYPE_LABELS[report.defectType]}</li>
        <li><strong>Priority:</strong> ${PRIORITY_LABELS[report.priority]}</li>
      </ul>
      <p>Full details are attached as a PDF, and the report is on the board for review.</p>
    `,
    attachments: [
      {
        filename: `${report.reportNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });
}
