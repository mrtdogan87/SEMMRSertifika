import fs from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { getStorageRoot } from "@/lib/config";

function isRemoteStoragePath(value: string) {
  return /^https?:\/\//i.test(value);
}

function canUseBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function ensureStorageRoot() {
  const root = getStorageRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}

export async function writeCertificatePdf(recordId: string, bytes: Uint8Array) {
  if (canUseBlobStorage()) {
    const blob = await put(`certificates/${recordId}-${Date.now()}.pdf`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/pdf",
    });

    return {
      absolutePath: blob.url,
      relativePath: blob.url,
      fileSize: bytes.byteLength,
    };
  }

  const root = await ensureStorageRoot();
  const fileName = `${recordId}.pdf`;
  const absolutePath = path.join(root, fileName);
  await fs.writeFile(absolutePath, bytes);

  return {
    absolutePath,
    relativePath: fileName,
    fileSize: bytes.byteLength,
  };
}

export async function readCertificatePdf(relativePath: string) {
  if (isRemoteStoragePath(relativePath)) {
    const response = await fetch(relativePath);
    if (!response.ok) {
      throw new Error("PDF dosyası okunamadı.");
    }

    return Buffer.from(await response.arrayBuffer());
  }

  const root = await ensureStorageRoot();
  const absolutePath = path.join(root, relativePath);
  return fs.readFile(absolutePath);
}

export async function deleteCertificatePdf(relativePath: string) {
  if (isRemoteStoragePath(relativePath)) {
    if (canUseBlobStorage()) {
      await del(relativePath);
    }
    return;
  }

  const root = await ensureStorageRoot();
  const absolutePath = path.join(root, relativePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function saveTemplateBackground(params: {
  type: string;
  fileName: string;
  bytes: Buffer;
}) {
  const extension = path.extname(params.fileName).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(extension)) {
    throw new Error("Sadece PNG, JPG veya JPEG dosyaları yüklenebilir.");
  }

  if (canUseBlobStorage()) {
    const blob = await put(`certificate-backgrounds/${params.type.toLowerCase()}-${Date.now()}${extension}`, params.bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: extension === ".png" ? "image/png" : "image/jpeg",
    });

    return blob.url;
  }

  const targetDir = path.join(process.cwd(), "public", "certificate-backgrounds");
  await fs.mkdir(targetDir, { recursive: true });
  const outputName = `${params.type.toLowerCase()}-${Date.now()}${extension}`;
  const absolutePath = path.join(targetDir, outputName);
  await fs.writeFile(absolutePath, params.bytes);

  return `/certificate-backgrounds/${outputName}`;
}
