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
