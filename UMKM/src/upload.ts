import path from "path";
import fs from "fs";

const UPLOAD_DIR_PUBLIC = path.resolve(__dirname, "../public/images");
const UPLOAD_DIR_DIST = path.resolve(__dirname, "../dist/images");

if (!fs.existsSync(UPLOAD_DIR_PUBLIC)) {
  fs.mkdirSync(UPLOAD_DIR_PUBLIC, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR_DIST)) {
  fs.mkdirSync(UPLOAD_DIR_DIST, { recursive: true });
}

export async function saveUploadedLogo(file: File): Promise<string> {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only PNG, JPEG, WEBP, and SVG are supported.");
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const ext = file.name.split(".").pop() || "png";
  const safeFilename = `biz-logo-${Date.now()}.${ext.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Save to public/images
  const publicPath = path.join(UPLOAD_DIR_PUBLIC, safeFilename);
  fs.writeFileSync(publicPath, bytes);

  // Also copy to dist/images if dist exists
  const distPath = path.join(UPLOAD_DIR_DIST, safeFilename);
  try {
    fs.writeFileSync(distPath, bytes);
  } catch {}

  return `/images/${safeFilename}`;
}

export async function saveUploadedAvatar(file: File): Promise<string> {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPG, JPEG and PNG are supported.");
  }
  if (file.size > 1 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 1MB.");
  }
  const ext = file.name.split(".").pop() || "png";
  const safeFilename = `avatar-${Date.now()}.${ext.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  fs.writeFileSync(path.join(UPLOAD_DIR_PUBLIC, safeFilename), bytes);
  try {
    fs.writeFileSync(path.join(UPLOAD_DIR_DIST, safeFilename), bytes);
  } catch {}

  return `/images/${safeFilename}`;
}
