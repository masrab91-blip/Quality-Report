import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getPhotoBuffer, isStorageConfigured } from "@/lib/storage";
import { renderReportPdf, type PdfPhoto } from "@/lib/pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifySession();

  const report = await prisma.report.findUnique({ where: { id }, include: { photos: true } });
  if (!report) notFound();
  if (session.role !== "MANAGER" && report.submittedById !== session.userId) notFound();

  const photos: PdfPhoto[] = [];
  if (isStorageConfigured()) {
    for (const photo of report.photos) {
      try {
        const buffer = await getPhotoBuffer(photo.key);
        photos.push({ buffer, contentType: photo.contentType });
      } catch {
        // Skip photos that can't be fetched rather than failing the whole PDF.
      }
    }
  }

  const pdfBuffer = await renderReportPdf(report, photos);

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.reportNumber}.pdf"`,
    },
  });
}
