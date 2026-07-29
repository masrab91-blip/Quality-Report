import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPhotoBuffer, isStorageConfigured } from "@/lib/storage";
import { renderReportPdf, type PdfPhoto } from "@/lib/pdf";

// Same trust model as the public report detail page: anyone with the link
// (or the report id) can fetch the PDF, no account required.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const report = await prisma.report.findUnique({ where: { id }, include: { photos: true } });
  if (!report) notFound();

  const photos: PdfPhoto[] = [];
  if (isStorageConfigured()) {
    for (const photo of report.photos) {
      try {
        const buffer = await getPhotoBuffer(photo.key);
        photos.push({ buffer, contentType: photo.contentType });
      } catch (err) {
        // Skip photos that can't be fetched rather than failing the whole PDF.
        console.error(`Couldn't fetch photo ${photo.key} for PDF:`, err);
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
