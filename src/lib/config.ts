import path from "node:path";

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "change-this-secret";
}

export function getStorageRoot() {
  const input = process.env.FILE_STORAGE_ROOT ?? "./storage/certificates";
  return path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
}

export function getBootstrapAdmin() {
  return {
    email: (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "").trim().toLowerCase(),
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "",
  };
}

export function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY ?? "",
    senderEmail: process.env.RESEND_SENDER_EMAIL ?? "",
    senderName: process.env.RESEND_SENDER_NAME ?? "SEMMR Sertifika",
  };
}
