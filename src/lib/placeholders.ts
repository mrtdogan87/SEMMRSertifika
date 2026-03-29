import type { CertificateType } from "@prisma/client";
import type { CertificateCustomFields, PlaceholderValues } from "@/types/certificate";
import { getCertificateTypeLabel } from "@/lib/certificate-presets";
import { formatDateTR } from "@/lib/utils";

const ALLOWED = [
  "AD",
  "SERTIFIKA_BASLIGI",
  "MAKALE_ADI",
  "TARIH",
  "MAKALE_ID",
  "DEGERLENDIRME_TARIHI",
  "EPOSTA",
  "SERTIFIKA_TURU",
] as const;

export function validateTemplatePlaceholders(input: string) {
  const matches = input.match(/\{\{(\w+)\}\}/g) ?? [];
  const invalid = matches
    .map((match) => match.slice(2, -2))
    .filter((key) => !ALLOWED.includes(key as (typeof ALLOWED)[number]));

  if (invalid.length) {
    throw new Error(`Tanımsız placeholder bulundu: ${invalid.join(", ")}`);
  }
}

export function buildPlaceholderValues(params: {
  fullName: string;
  email: string;
  articleTitle: string;
  date: Date | null;
  certificateTitle: string;
  type: CertificateType;
  customFields: CertificateCustomFields;
}): PlaceholderValues {
  return {
    AD: params.fullName,
    SERTIFIKA_BASLIGI: params.certificateTitle,
    MAKALE_ADI: params.articleTitle,
    TARIH: formatDateTR(params.date),
    MAKALE_ID: params.customFields.articleId ?? "",
    DEGERLENDIRME_TARIHI: params.customFields.evaluationDate ?? "",
    EPOSTA: params.email,
    SERTIFIKA_TURU: getCertificateTypeLabel(params.type),
  };
}

export function fillTemplate(input: string, values: PlaceholderValues) {
  validateTemplatePlaceholders(input);
  return input.replace(/\{\{(\w+)\}\}/g, (_match, key) => values[key as keyof PlaceholderValues] ?? "");
}
