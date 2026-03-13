/**
 * storage.js — Storage Provider Abstraction
 *
 * To swap providers later, change VITE_STORAGE_PROVIDER in your .env:
 *   VITE_STORAGE_PROVIDER=cloudinary   ← current (free, 25GB)
 *   VITE_STORAGE_PROVIDER=s3           ← future AWS S3
 *
 * Each provider must implement:
 *   uploadFile(file, onProgress) → Promise<string>  (returns public URL)
 *
 * To add a new provider: add a new block under "PROVIDERS" below.
 */

// ─────────────────────────────────────────────────────────────
//  PROVIDERS
// ─────────────────────────────────────────────────────────────

const providers = {

  // ── Cloudinary (current default) ─────────────────────────
  cloudinary: {
    name: "Cloudinary",
    uploadFile(file, onProgress = () => {}) {
      const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        return Promise.reject(
          new Error(
            "Cloudinary not configured. " +
            "Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your .env"
          )
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
        );
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200) resolve(data.secure_url);
          else reject(new Error(data.error?.message || "Cloudinary upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });
    },
  },

  // ── AWS S3 (future — swap when ready) ─────────────────────
  // To activate:
  //   1. Set VITE_STORAGE_PROVIDER=s3 in .env
  //   2. Add a backend route POST /api/storage/presign that returns { url, fields, fileUrl }
  //   3. Uncomment and fill in this block
  //
  // s3: {
  //   name: "AWS S3",
  //   async uploadFile(file, onProgress = () => {}) {
  //     // Step 1: ask your backend for a presigned POST URL (keeps AWS keys server-side)
  //     const res = await fetch("/api/storage/presign", {
  //       method: "POST",
  //       credentials: "include",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ filename: file.name, contentType: file.type }),
  //     });
  //     if (!res.ok) throw new Error("Failed to get upload URL");
  //     const { url, fields, fileUrl } = await res.json();
  //
  //     // Step 2: POST directly to S3 using the presigned fields
  //     const formData = new FormData();
  //     Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
  //     formData.append("file", file);
  //
  //     await new Promise((resolve, reject) => {
  //       const xhr = new XMLHttpRequest();
  //       xhr.open("POST", url);
  //       xhr.upload.onprogress = (e) => {
  //         if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
  //       };
  //       xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error("S3 upload failed"));
  //       xhr.onerror = () => reject(new Error("Network error during S3 upload"));
  //       xhr.send(formData);
  //     });
  //
  //     return fileUrl; // public URL of the uploaded file
  //   },
  // },

};

// ─────────────────────────────────────────────────────────────
//  ACTIVE PROVIDER — reads from env, falls back to cloudinary
// ─────────────────────────────────────────────────────────────

const PROVIDER_KEY = import.meta.env.VITE_STORAGE_PROVIDER || "cloudinary";

const activeProvider = providers[PROVIDER_KEY];

if (!activeProvider) {
  throw new Error(
    `Unknown storage provider: "${PROVIDER_KEY}". ` +
    `Valid options: ${Object.keys(providers).join(", ")}`
  );
}

/**
 * uploadFile(file, onProgress?) → Promise<string>
 *
 * Upload a File object and return its public URL.
 * onProgress(percent: 0-100) is called during upload.
 *
 * Usage:
 *   import { uploadFile } from "../../lib/storage";
 *   const url = await uploadFile(file, (p) => setProgress(p));
 */
export function uploadFile(file, onProgress) {
  return activeProvider.uploadFile(file, onProgress);
}

/** Which provider is currently active (useful for debug/logging) */
export const storageProviderName = activeProvider.name;
