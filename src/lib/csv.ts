import { parse } from "csv-parse/sync";
import type { CertificateType } from "@prisma/client";
import type { CertificateFormInput } from "@/types/certificate";
import { normalizeKey } from "@/lib/utils";

const HEADER_ALIASES: Record<string, keyof CertificateFormInput | null> = {
  "ad soyad": "fullName",
  "e-posta": "email",
  "eposta": "email",
  etkinlik: "eventName",
  tarih: "eventDate",
  duzenleyici: "organizer",
  "düzenleyici": "organizer",
  "özel alan 1": "ozel1",
  "ozel alan 1": "ozel1",
  "özel alan 2": "ozel2",
  "ozel alan 2": "ozel2",
  "özel alan 3": "ozel3",
  "ozel alan 3": "ozel3",
};

export function parseCertificateCsv(input: string, templateId: string, type: CertificateType) {
  const rows = parse(input, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  }) as Array<Record<string, string>>;

  return rows
    .map((row) => {
      const mapped: Partial<CertificateFormInput> = {
        templateId,
        type,
      };

      for (const [header, value] of Object.entries(row)) {
        const alias = HEADER_ALIASES[normalizeKey(header)];
        if (!alias) {
          continue;
        }

        (mapped as Record<string, string | undefined>)[alias] = value;
      }

      return mapped as CertificateFormInput;
    })
    .filter((row) => row.fullName?.trim());
}
