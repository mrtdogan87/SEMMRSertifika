import type { CertificateType } from "@prisma/client";
import { getDefaultCertificateTitle, getDefaultEvaluationLabel } from "@/lib/certificate-presets";

export type LayoutAlign = "left" | "center" | "right";
export type LabelConfig = {
  text: string;
  fontSize: number;
  bold: boolean;
};

export type CertificateLayout = {
  pageWidth: number;
  pageHeight: number;
  backgroundInset: number;
  defaults: {
    certificateTitle: string;
  };
  labels: {
    date: LabelConfig;
    articleId: LabelConfig;
    evaluationDate: LabelConfig;
  };
  certificateTitle: { x: number; y: number; size: number; align: LayoutAlign };
  name: { x: number; y: number; size: number; align: LayoutAlign };
  message: { x: number; y: number; size: number; width: number; lineHeight: number; align: LayoutAlign };
  articleTitle: { x: number; y: number; size: number; align: LayoutAlign };
  date: { x: number; y: number; size: number; align: LayoutAlign };
  articleId: { x: number; y: number; size: number; align: LayoutAlign };
  evaluationDate: { x: number; y: number; size: number; align: LayoutAlign };
};

function getBaseLabels(type: CertificateType) {
  return {
    date: { text: "Sertifika Tarihi", fontSize: 15, bold: true },
    articleId: { text: "Makale ID", fontSize: 14, bold: true },
    evaluationDate: {
      text: getDefaultEvaluationLabel(type),
      fontSize: 14,
      bold: true,
    },
  };
}

function getBaseDefaults(type: CertificateType) {
  return {
    certificateTitle: getDefaultCertificateTitle(type),
  };
}

const baseLayoutWithoutLabels = {
  pageWidth: 842,
  pageHeight: 595,
  backgroundInset: 0,
  certificateTitle: { x: 421, y: 468, size: 18, align: "center" },
  name: { x: 421, y: 340, size: 30, align: "center" },
  message: { x: 421, y: 287, size: 14, width: 460, lineHeight: 19, align: "center" },
  articleTitle: { x: 421, y: 228, size: 20, align: "center" },
  date: { x: 421, y: 148, size: 15, align: "center" },
  articleId: { x: 421, y: 124, size: 14, align: "center" },
  evaluationDate: { x: 421, y: 100, size: 14, align: "center" },
} as const;

export function getDefaultLayout(type: CertificateType): CertificateLayout {
  const baseLayout: CertificateLayout = {
    ...baseLayoutWithoutLabels,
    defaults: getBaseDefaults(type),
    labels: getBaseLabels(type),
  };

  switch (type) {
    case "HAKEMLIK":
      return {
        ...baseLayout,
        name: { ...baseLayout.name, size: 31 },
      };
    case "EDITORLUK":
      return {
        ...baseLayout,
        message: { ...baseLayout.message, width: 500 },
      };
    case "YAZARLIK":
      return {
        ...baseLayout,
        articleTitle: { ...baseLayout.articleTitle, size: 18 },
      };
    case "DIGER":
      return {
        ...baseLayout,
      };
  }
}

export function mergeLabelConfig(defaults: LabelConfig, value: unknown) {
  if (typeof value === "string") {
    return {
      ...defaults,
      text: value,
    };
  }

  if (value && typeof value === "object") {
    return {
      ...defaults,
      ...(value as Partial<LabelConfig>),
    };
  }

  return defaults;
}

function resolveEvaluationLabel(defaults: LabelConfig, value: unknown, type: CertificateType) {
  const merged = mergeLabelConfig(defaults, value);

  if ((type === "EDITORLUK" || type === "YAZARLIK") && merged.text === "Değerlendirme Tarihi") {
    return {
      ...merged,
      text: getDefaultEvaluationLabel(type),
    };
  }

  return merged;
}

export function resolveLayoutConfig(type: CertificateType, value: unknown) {
  const defaults = getDefaultLayout(type);

  if (typeof value === "string") {
    try {
      return resolveLayoutConfig(type, JSON.parse(value) as Partial<CertificateLayout>);
    } catch {
      return defaults;
    }
  }

  if (value && typeof value === "object") {
    const parsed = value as Partial<CertificateLayout>;
    return {
      ...defaults,
      ...parsed,
      defaults: {
        ...defaults.defaults,
        ...parsed.defaults,
      },
      labels: {
        date: mergeLabelConfig(defaults.labels.date, parsed.labels?.date),
        articleId: mergeLabelConfig(defaults.labels.articleId, parsed.labels?.articleId),
        evaluationDate: resolveEvaluationLabel(defaults.labels.evaluationDate, parsed.labels?.evaluationDate, type),
      },
      certificateTitle: { ...defaults.certificateTitle, ...parsed.certificateTitle },
      name: { ...defaults.name, ...parsed.name },
      message: { ...defaults.message, ...parsed.message },
      articleTitle: { ...defaults.articleTitle, ...parsed.articleTitle },
      date: { ...defaults.date, ...parsed.date },
      articleId: { ...defaults.articleId, ...parsed.articleId },
      evaluationDate: { ...defaults.evaluationDate, ...parsed.evaluationDate },
    };
  }

  return defaults;
}
