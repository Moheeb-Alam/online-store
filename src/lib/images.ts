// Product image settings shared by the upload button and the server.

/** Public Supabase Storage bucket (created in supabase/schema.sql, section 8). */
export const PRODUCT_IMAGE_BUCKET = "product-images";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
} as const;

/**
 * Cleans a pasted image link. A Google Drive share link
 * (drive.google.com/file/d/<id>/view or ...open?id=<id>) points to a web page,
 * not an image, so it is turned into Google's direct image address.
 * The Drive file must be shared as "Anyone with the link".
 */
export function normalizeImageUrl(input: string) {
  const url = input.trim();
  const driveId =
    url.match(/drive\.google\.com\/file\/d\/([\w-]{10,})/)?.[1] ??
    url.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]{10,})/)?.[1];
  return driveId ? `https://lh3.googleusercontent.com/d/${driveId}` : url;
}
