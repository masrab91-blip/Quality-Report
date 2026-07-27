import "server-only";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { Report } from "@/generated/prisma/client";
import { DEFECT_TYPE_LABELS, PRIORITY_LABELS } from "@/lib/validation";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#555", marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 130, color: "#555" },
  value: { flex: 1 },
  description: { marginTop: 4, lineHeight: 1.4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  photo: { width: 150, height: 150, objectFit: "cover" },
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

export async function renderReportPdf(report: Report, photos: PdfPhoto[] = []): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Quality Issue Report {report.reportNumber}</Text>
        <Text style={styles.subtitle}>
          Stage: {report.stage} · Priority: {PRIORITY_LABELS[report.priority]} · Submitted{" "}
          {report.createdAt.toLocaleString("en-US")}
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

        {photos.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos ({photos.length})</Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, i) => (
                <Image key={i} style={styles.photo} src={photo.buffer} />
              ))}
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
