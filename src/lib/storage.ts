import "server-only";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";

function getConfig() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT; // set for R2 / MinIO / any S3-compatible host

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return { bucket, region, accessKeyId, secretAccessKey, endpoint };
}

export function isStorageConfigured(): boolean {
  return getConfig() !== null;
}

let cachedClient: S3Client | null = null;
function getClient(config: NonNullable<ReturnType<typeof getConfig>>): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    // R2/MinIO expect path-style addressing; harmless for AWS S3 too.
    forcePathStyle: Boolean(config.endpoint),
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}

// Photo bytes go straight from the browser to the bucket via a presigned PUT
// (never through a Next.js server action/route body) so uploads aren't capped
// by the small request-body limits serverless hosts impose on app functions.
export async function presignPhotoUpload(
  filename: string,
  contentType: string,
): Promise<{ key: string; uploadUrl: string }> {
  const config = getConfig();
  if (!config) {
    throw new Error("Object storage is not configured");
  }
  const client = getClient(config);
  const key = `photos/${randomUUID()}-${filename}`;
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: contentType }),
    { expiresIn: 60 * 10 },
  );
  return { key, uploadUrl };
}

// Bucket is treated as private (internal-only tool); callers must render
// with a short-lived presigned URL rather than a public link.
export async function getPhotoUrl(key: string): Promise<string> {
  const config = getConfig();
  if (!config) {
    throw new Error("Object storage is not configured");
  }
  const client = getClient(config);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: config.bucket, Key: key }),
    { expiresIn: 60 * 15 },
  );
}

// Used server-side to embed photo bytes directly into the generated PDF.
export async function getPhotoBuffer(key: string): Promise<Buffer> {
  const config = getConfig();
  if (!config) {
    throw new Error("Object storage is not configured");
  }
  const client = getClient(config);
  const result = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
  const stream = result.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
