"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/dal";
import { logAudit } from "@/lib/audit";
import { nextReportNumber } from "@/lib/report-number";
import { intakeSchema, reportEditSchema } from "@/lib/validation";
import { getPhotoBuffer, isStorageConfigured } from "@/lib/storage";
import { renderReportPdf, type PdfPhoto } from "@/lib/pdf";
import { sendSubmissionEmail } from "@/lib/email";
import type { Report, Stage } from "@/generated/prisma/client";

export type ActionState = { error?: string } | undefined;

const photoRefSchema = z.array(
  z.object({ key: z.string(), contentType: z.string(), size: z.number() }),
);

function parsePhotoRefs(formData: FormData) {
  const raw = String(formData.get("photos") ?? "[]");
  try {
    return photoRefSchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

// Open to anyone — no account required. Only the manager board is gated.
export async function createReportAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (formData.get("photosUploading") === "1") {
    return { error: "Wait for photo uploads to finish before submitting." };
  }

  const parsed = intakeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." };
  }
  const data = parsed.data;
  const photos = parsePhotoRefs(formData);
  const notes = String(formData.get("notes") ?? "").trim();

  const report = await prisma.$transaction(async (tx) => {
    const reportNumber = await nextReportNumber(tx);
    const created = await tx.report.create({
      data: {
        reportNumber,
        stage: "SUBMITTED",
        customer: data.customer,
        jobsite: data.jobsite || null,
        po: data.po || null,
        vendor: data.vendor || null,
        product: data.product || null,
        colorLot: data.colorLot || null,
        qty: data.qty ?? null,
        defectType: data.defectType,
        priority: data.priority,
        jobStopped: data.jobStopped,
        description: data.description,
        notesSubmitted: notes || null,
        reportedBy: data.reportedBy,
        dateReported: new Date(),
        photos: {
          create: photos.map((p) => ({ key: p.key, contentType: p.contentType, size: p.size })),
        },
      },
    });
    await logAudit(tx, { reportId: created.id, actorName: data.reportedBy, action: "created" });
    return created;
  });

  await notifyManager(report).catch((err) => {
    console.error(`Failed to generate/send report ${report.reportNumber}:`, err);
  });

  redirect(`/report/${report.id}`);
}

async function notifyManager(report: Report) {
  const photoRows = await prisma.photo.findMany({ where: { reportId: report.id } });
  const photos: PdfPhoto[] = [];
  if (isStorageConfigured()) {
    for (const photo of photoRows) {
      try {
        const buffer = await getPhotoBuffer(photo.key);
        photos.push({ buffer, contentType: photo.contentType });
      } catch (err) {
        console.error(`Couldn't fetch photo ${photo.key} for PDF:`, err);
      }
    }
  }
  const pdfBuffer = await renderReportPdf(report, photos);
  await sendSubmissionEmail(report, pdfBuffer);
}

export async function updateReportAction(reportId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireManager();

  const parsed = reportEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form for errors." };
  }
  const data = parsed.data;

  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) {
    return { error: "Report not found." };
  }

  const nextValues: Record<string, unknown> = {
    customer: data.customer,
    jobsite: data.jobsite || null,
    po: data.po || null,
    vendor: data.vendor || null,
    product: data.product || null,
    colorLot: data.colorLot || null,
    qty: data.qty ?? null,
    defectType: data.defectType,
    priority: data.priority,
    jobStopped: data.jobStopped,
    description: data.description,
    reportedBy: data.reportedBy,
    dateReported: data.dateReported ? new Date(data.dateReported) : null,
    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
    bolNumber: data.bolNumber || null,
    rootCause: data.rootCause || null,
    investigatedBy: data.investigatedBy || null,
    resolution: data.resolution || null,
    vendorClaimFiled: data.vendorClaimFiled,
    claimRmaNumber: data.claimRmaNumber || null,
    creditAmount: data.creditAmount ?? null,
    closedBy: data.closedBy || null,
    dateClosed: data.dateClosed ? new Date(data.dateClosed) : null,
  };

  await prisma.$transaction(async (tx) => {
    for (const [field, newValue] of Object.entries(nextValues)) {
      const oldValue = (existing as unknown as Record<string, unknown>)[field];
      if (serialize(oldValue) !== serialize(newValue)) {
        await logAudit(tx, {
          reportId,
          userId: session.userId,
          action: "field_updated",
          field,
          oldValue: serialize(oldValue),
          newValue: serialize(newValue),
        });
      }
    }
    await tx.report.update({ where: { id: reportId }, data: nextValues });
  });

  redirect(`/board/${reportId}`);
}

function serialize(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export async function moveStageAction(reportId: string, stage: Stage) {
  const session = await requireManager();
  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) return;
  if (existing.stage === stage) return;

  await prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id: reportId }, data: { stage } });
    await logAudit(tx, {
      reportId,
      userId: session.userId,
      action: "stage_changed",
      field: "stage",
      oldValue: existing.stage,
      newValue: stage,
    });
  });

  revalidatePath("/board");
  revalidatePath(`/board/${reportId}`);
}

const NOTE_FIELDS = {
  submitted: "notesSubmitted",
  reviewed: "notesReviewed",
  resolved: "notesResolved",
} as const;

export async function addNoteAction(
  reportId: string,
  stage: keyof typeof NOTE_FIELDS,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireManager();
  const text = String(formData.get("note") ?? "").trim();
  if (!text) {
    return { error: "Note can't be empty." };
  }

  const field = NOTE_FIELDS[stage];
  const existing = await prisma.report.findUnique({ where: { id: reportId } });
  if (!existing) {
    return { error: "Report not found." };
  }

  const existingText = (existing as unknown as Record<string, string | null>)[field];
  const entry = `[${new Date().toLocaleString("en-US")} — ${session.name}] ${text}`;
  const combined = existingText ? `${existingText}\n\n${entry}` : entry;

  await prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id: reportId }, data: { [field]: combined } });
    await logAudit(tx, {
      reportId,
      userId: session.userId,
      action: "note_added",
      field,
      oldValue: existingText,
      newValue: combined,
    });
  });

  revalidatePath(`/board/${reportId}`);
}
