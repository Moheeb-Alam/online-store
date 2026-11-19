"use client";

import { createClient } from "@supabase/supabase-js";
import { useRef, useState, type DragEvent } from "react";
import { ProductImage } from "@/components/product-image";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, PRODUCT_IMAGE_BUCKET, normalizeImageUrl } from "@/lib/images";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { createImageUpload } from "../actions";

const MAX_SIDE = 1200;

/** Shrinks big photos to max 1200px WebP so product pages load fast. */
async function compress(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file; // keep animations
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // browser could not decode it; upload the original
  }
}

export function ImageUploader({
  value,
  onChange,
  name,
  categorySlug,
}: {
  value: string;
  onChange: (url: string) => void;
  name: string;
  categorySlug: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const preview = /^https:\/\/\S+$/i.test(value) ? normalizeImageUrl(value) : null;

  async function upload(file: File) {
    setError(null);
    if (!(file.type in IMAGE_TYPES)) {
      setError("Please choose a JPG, PNG, WebP, AVIF or GIF image.");
      return;
    }
    setStatus("uploading");
    try {
      const body = await compress(file);
      if (body.size > MAX_IMAGE_BYTES) {
        setError("This image is larger than 5 MB. Please choose a smaller one.");
        return;
      }
      const contentType = body.type || file.type;
      const ticket = await createImageUpload(contentType, body.size);
      if (!ticket.ok) {
        setError(ticket.error);
        return;
      }
      const { error: uploadError } = await createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
      })
        .storage.from(PRODUCT_IMAGE_BUCKET)
        .uploadToSignedUrl(ticket.path, ticket.token, body, { contentType });
      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }
      onChange(ticket.publicUrl);
    } catch {
      setError("Upload failed. Check your internet connection and try again.");
    } finally {
      setStatus("idle");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  const uploading = status === "uploading";

  return (
    <div className="space-y-3">
      <input type="hidden" name="image_url" value={value} />
      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(IMAGE_TYPES).join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative aspect-square overflow-hidden rounded-xl ring-1 transition ${
          dragging ? "ring-2 ring-rose-500" : "ring-slate-200"
        }`}
      >
        {preview ? (
          <ProductImage name={name} imageUrl={preview} categorySlug={categorySlug} />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center transition hover:bg-slate-100"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm ring-1 ring-slate-200">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 16V4M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-slate-900">Click to upload or drag & drop</span>
            <span className="text-xs text-slate-500">JPG, PNG or WebP · up to 5 MB</span>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 text-sm font-semibold text-slate-700">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
            Uploading…
          </div>
        )}
      </div>

      {preview && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="adm-btn-secondary flex-1"
          >
            Replace image
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={uploading}
            className="adm-btn border border-slate-200 bg-white text-rose-700 hover:bg-rose-50"
          >
            Remove
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      <div className="border-t border-slate-100 pt-3">
        {showLink ? (
          <div>
            <label htmlFor="image_link" className="adm-label">Image link</label>
            <input
              id="image_link"
              type="url"
              value={value}
              onChange={(e) => onChange(normalizeImageUrl(e.target.value))}
              placeholder="https://… or a Google Drive link"
              className="adm-input"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              Google Drive: share the file as “Anyone with the link”, then paste the link here.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLink(true)}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600"
          >
            Or paste an image link (Google Drive, website…)
          </button>
        )}
      </div>
    </div>
  );
}
