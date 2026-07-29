import { NextResponse } from "next/server";
import { isStorageConfigured, presignPhotoUpload } from "@/lib/storage";

const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

// Open to anyone — report submission itself requires no account.
export async function POST(req: Request) {
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const filename = typeof body?.filename === "string" ? body.filename : "";
  const contentType = typeof body?.contentType === "string" ? body.contentType : "";
  const size = typeof body?.size === "number" ? body.size : 0;

  if (!filename || !ACCEPTED_IMAGE_TYPES.has(contentType)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }
  if (size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const { key, uploadUrl } = await presignPhotoUpload(filename, contentType);
  return NextResponse.json({ key, uploadUrl, contentType });
}
