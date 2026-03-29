import * as XLSX from "xlsx";
import type { CertificateType } from "@prisma/client";
import { getDefaultEvaluationLabel } from "@/lib/certificate-presets";
import type { CertificateFormInput } from "@/types/certificate";
import { normalizeKey } from "@/lib/utils";

const HEADER_ALIASES: Record<string, keyof CertificateFormInput | null> = {
  "ad soyad": "fullName",
  "e-posta": "email",
  eposta: "email",
  etkinlik: "articleTitle",
  "makale adi": "articleTitle",
  "makale adı": "articleTitle",
  tarih: "date",
  "sertifika tarihi": "date",
  "sertifika basligi": "certificateTitle",
  "sertifika başlığı": "certificateTitle",
  "makale id": "articleId",
  "ilgili tarih": "evaluationDate",
  "yayin basim tarihi": "evaluationDate",
  "yayın basım tarihi": "evaluationDate",
  "degerlendirme tarihi": "evaluationDate",
  "değerlendirme tarihi": "evaluationDate",
};

function expectedEvaluationHeader(type: CertificateType) {
  return getDefaultEvaluationLabel(type);
}

export function buildTemplateWorkbook(type: CertificateType) {
  const headers = [
    "Ad Soyad",
    "E-posta",
    "Makale Adı",
    "Sertifika Tarihi",
    "Sertifika Başlığı",
    "Makale ID",
    expectedEvaluationHeader(type),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SertifikaListesi");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function parseCertificateSpreadsheet(input: Buffer, templateId: string) {
  const workbook = XLSX.read(input, { type: "buffer", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    return [];
  }

  const normalizedHeaders = Object.keys(rows[0] ?? {}).map((header) => normalizeKey(header));
  const mappedHeaders = new Set(
    normalizedHeaders
      .map((header) => HEADER_ALIASES[header])
      .filter((value): value is keyof CertificateFormInput => Boolean(value)),
  );

  const missingHeaders: string[] = [];
  if (!mappedHeaders.has("fullName")) missingHeaders.push("Ad Soyad");
  if (!mappedHeaders.has("email")) missingHeaders.push("E-posta");
  if (!mappedHeaders.has("articleTitle")) missingHeaders.push("Makale Adı");

  if (missingHeaders.length) {
    throw new Error(`Excel başlıklarında eksik alan var: ${missingHeaders.join(", ")}`);
  }

  return rows
    .map((row) => {
      const mapped: CertificateFormInput = {
        templateId,
        fullName: "",
        email: "",
        articleTitle: "",
        date: "",
        certificateTitle: "",
        articleId: "",
        evaluationDate: "",
      };

      for (const [header, value] of Object.entries(row)) {
        const alias = HEADER_ALIASES[normalizeKey(header)];
        if (!alias) {
          continue;
        }

        (mapped as Record<string, string>)[alias] = String(value ?? "").trim();
      }

      return mapped;
    })
    .filter((row) => row.fullName.trim());
}
