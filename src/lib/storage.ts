import fs from "node:fs/promises";
import path from "node:path";
import { getStorageRoot } from "@/lib/config";

export async function ensureStorageRoot() {
  const root = getStorageRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}

export async function writeCertificatePdf(recordId: string, bytes: Uint8Array) {
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
  const root = await ensureStorageRoot();
  const absolutePath = path.join(root, relativePath);
  return fs.readFile(absolutePath);
}

export async function deleteCertificatePdf(relativePath: string) {
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
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
    throw new Error("Sadece PNG, JPG, JPEG veya WEBP dosyaları yüklenebilir.");
  }

  const targetDir = path.join(process.cwd(), "public", "certificate-backgrounds");
  await fs.mkdir(targetDir, { recursive: true });
  const outputName = `${params.type.toLowerCase()}-${Date.now()}${extension}`;
  const absolutePath = path.join(targetDir, outputName);
  await fs.writeFile(absolutePath, params.bytes);

  return `/certificate-backgrounds/${outputName}`;
}
