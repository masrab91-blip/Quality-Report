"use client";

import { useState, useCallback } from "react";

type UploadItem = {
  id: string;
  name: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  key?: string;
  contentType?: string;
  size?: number;
  error?: string;
};

const MAX_PHOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;

export function PhotoUploader({ storageConfigured }: { storageConfigured: boolean }) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const uploadOne = useCallback(async (file: File, id: string) => {
    try {
      const presignRes = await fetch("/api/photos/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(body.error === "file_too_large" ? "File is over 10MB" : "Couldn't prepare upload");
      }
      const { key, uploadUrl, contentType } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: "done", key, contentType, size: file.size } : it)),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "error", error: err instanceof Error ? err.message : "Upload failed" } : it,
        ),
      );
    }
  }, []);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (items.length + files.length > MAX_PHOTOS) {
      alert(`You can attach at most ${MAX_PHOTOS} photos.`);
      return;
    }
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        alert(`"${file.name}" is larger than the 10MB limit and was skipped.`);
        continue;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setItems((prev) => [...prev, { id, name: file.name, previewUrl, status: "uploading" }]);
      void uploadOne(file, id);
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const confirmedKeys = items
    .filter((it) => it.status === "done" && it.key)
    .map((it) => ({ key: it.key, contentType: it.contentType, size: it.size }));

  const anyUploading = items.some((it) => it.status === "uploading");

  if (!storageConfigured) {
    return (
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        Photo storage isn&apos;t configured yet, so photos can&apos;t be attached right now — the rest of the
        report will still submit normally.
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm"
      />
      <input type="hidden" name="photos" value={JSON.stringify(confirmedKeys)} />
      <input type="hidden" name="photosUploading" value={anyUploading ? "1" : ""} />

      {items.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="relative rounded-md border border-gray-200 p-1">
              <img src={it.previewUrl} alt={it.name} className="h-20 w-full rounded object-cover" />
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                aria-label={`Remove ${it.name}`}
              >
                ×
              </button>
              <p className="mt-1 truncate text-xs">
                {it.status === "uploading" && "Uploading…"}
                {it.status === "done" && "Ready"}
                {it.status === "error" && <span className="text-red-600">{it.error}</span>}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
