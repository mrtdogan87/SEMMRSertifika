import type { CertificateType } from "@prisma/client";
import type { CertificateCustomFields, PlaceholderValues } from "@/types/certificate";
import { formatDateTR } from "@/lib/utils";

const ALLOWED = [
  "AD",
  "ETKINLIK",
  "TARIH",
  "DUZENLEYICI",
  "EPOSTA",
  "SERTIFIKA_TURU",
  "OZEL_1",
  "OZEL_2",
  "OZEL_3",
] as const;

function typeLabel(type: CertificateType) {
  switch (type) {
    case "HAKEMLIK":
      return "Hakemlik";
    case "REKTORLUK":
      return "Rektörlük";
    case "YAZARLIK":
      return "Yazarlık";
  }
}

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
  eventName: string;
  eventDate: Date | null;
  organizer: string;
  type: CertificateType;
  customFields: CertificateCustomFields;
}): PlaceholderValues {
  return {
    AD: params.fullName,
    ETKINLIK: params.eventName,
    TARIH: formatDateTR(params.eventDate),
    DUZENLEYICI: params.organizer,
    EPOSTA: params.email,
    SERTIFIKA_TURU: typeLabel(params.type),
    OZEL_1: params.customFields.ozel1 ?? "",
    OZEL_2: params.customFields.ozel2 ?? "",
    OZEL_3: params.customFields.ozel3 ?? "",
  };
}

export function fillTemplate(input: string, values: PlaceholderValues) {
  validateTemplatePlaceholders(input);
  return input.replace(/\{\{(\w+)\}\}/g, (_match, key) => values[key as keyof PlaceholderValues] ?? "");
}
