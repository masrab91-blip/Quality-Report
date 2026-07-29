import "server-only";
import sharp from "sharp";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Report } from "@/generated/prisma/client";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/validation";
import { formatDateTime } from "@/lib/format";

const NAVY = "#1e293b";
const ACCENT = "#1d4ed8";
const MUTED = "#64748b";
const RULE = "#e2e8f0";

const styles = StyleSheet.create({
  page: { padding: 40, paddingTop: 32, fontSize: 10, fontFamily: "Helvetica", color: NAVY },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  wordmark: { fontFamily: "Times-Bold", fontSize: 20, letterSpacing: 3 },
  tagline: { fontSize: 7, letterSpacing: 2, color: MUTED, marginTop: 2 },
  docLabel: { fontSize: 9, color: MUTED, textAlign: "right" },
  accentRule: { height: 2, backgroundColor: ACCENT, marginTop: 10, marginBottom: 14 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 9, color: MUTED, marginBottom: 16 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 140, color: MUTED },
  value: { flex: 1 },
  description: { marginTop: 2, lineHeight: 1.4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  photo: { width: 150, height: 150, objectFit: "cover", borderRadius: 2 },
  photoNote: { fontSize: 8, color: MUTED, marginTop: 6, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 6,
  },
});

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

export type PdfPhoto = { buffer: Buffer; contentType: string };
type NormalizedPhoto = { data: Buffer; format: "png" };

// @react-pdf/renderer only auto-detects JPEG/PNG from a raw buffer — WebP and
// (especially) iPhone-style HEIC uploads silently fail to render. Normalizing
// everything to PNG server-side means every accepted upload type actually
// shows up, at the cost of a bit of PDF size. Anything sharp truly can't
// decode is skipped (logged) rather than breaking the whole document.
async function normalizePhotosForPdf(photos: PdfPhoto[]): Promise<{ normalized: NormalizedPhoto[]; skipped: number }> {
  const normalized: NormalizedPhoto[] = [];
  let skipped = 0;
  for (const photo of photos) {
    try {
      const data = await sharp(photo.buffer)
        .rotate() // respect EXIF orientation from phone cameras
        .resize({ width: 1000, withoutEnlargement: true })
        .png()
        .toBuffer();
      normalized.push({ data, format: "png" });
    } catch (err) {
      skipped += 1;
      console.error("Skipping a photo in the PDF — couldn't decode it:", err);
    }
  }
  return { normalized, skipped };
}

export async function renderReportPdf(report: Report, photos: PdfPhoto[] = []): Promise<Buffer> {
  const { normalized, skipped } = await normalizePhotosForPdf(photos);

  const doc = (
    <Document title={`Quality Issue Report ${report.reportNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.wordmark}>BELDEN</Text>
            <Text style={styles.tagline}>ARCHITECTURAL ELEMENTS</Text>
          </View>
          <Text style={styles.docLabel}>Quality Issue Report</Text>
        </View>
        <View style={styles.accentRule} />

        <Text style={styles.title}>{report.reportNumber}</Text>
        <Text style={styles.subtitle}>
          Stage: {report.stage} · Priority: {PRIORITY_LABELS[report.priority]} · Submitted{" "}
          {formatDateTime(report.createdAt)} · Reported by {report.reportedBy}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery details</Text>
          <Row label="Customer" value={report.customer} />
          <Row label="Job site" value={report.jobsite} />
          <Row label="Sales order / PO #" value={report.po} />
          <Row label="Vendor / manufacturer" value={report.vendor} />
          <Row label="Product / SKU" value={report.product} />
          <Row label="Color / style / lot #" value={report.colorLot} />
          <Row label="Quantity affected" value={report.qty} />
          <Row label="Defect type" value={DEFECT_TYPE_LABELS[report.defectType]} />
          <Row label="Job stopped/delayed" value={report.jobStopped ? "Yes" : "No"} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        {report.notesSubmitted ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submitted notes</Text>
            <Text style={styles.description}>{report.notesSubmitted}</Text>
          </View>
        ) : null}

        {normalized.length > 0 || skipped > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
            {normalized.length > 0 && (
              <View style={styles.photoGrid}>
                {normalized.map((photo, i) => (
                  <Image key={i} style={styles.photo} src={{ data: photo.data, format: photo.format }} />
                ))}
              </View>
            )}
            {skipped > 0 && (
              <Text style={styles.photoNote}>
                {skipped} photo{skipped > 1 ? "s" : ""} couldn&apos;t be included in this PDF — view the full report
                online for all photos.
              </Text>
            )}
          </View>
        ) : null}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Belden Brick and Supply — Quality Report   ·   Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
