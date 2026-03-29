import type { CertificateType } from "@prisma/client";

export type CertificatePreset = {
  type: CertificateType;
  label: string;
  slug: string;
  defaultTemplateName: string;
  defaultCertificateTitle: string;
  defaultEvaluationLabel: string;
  isCustom: boolean;
  guidance: string;
};

const CERTIFICATE_PRESETS: Record<CertificateType, CertificatePreset> = {
  HAKEMLIK: {
    type: "HAKEMLIK",
    label: "Hakemlik",
    slug: "hakemlik",
    defaultTemplateName: "Hakemlik Sertifikası",
    defaultCertificateTitle: "HAKEMLİK SERTİFİKASI",
    defaultEvaluationLabel: "Değerlendirme Tarihi",
    isCustom: false,
    guidance: "Varsayılan başlık HAKEMLİK SERTİFİKASI olarak gelir. Tarih etiketi Değerlendirme Tarihi kullanır.",
  },
  EDITORLUK: {
    type: "EDITORLUK",
    label: "Editörlük",
    slug: "editorluk",
    defaultTemplateName: "Editörlük Sertifikası",
    defaultCertificateTitle: "EDİTÖRLÜK SERTİFİKASI",
    defaultEvaluationLabel: "Yayın Basım Tarihi",
    isCustom: false,
    guidance: "Varsayılan başlık EDİTÖRLÜK SERTİFİKASI olarak gelir. Tarih etiketi Yayın Basım Tarihi kullanır.",
  },
  YAZARLIK: {
    type: "YAZARLIK",
    label: "Yazarlık",
    slug: "yazarlik",
    defaultTemplateName: "Yazarlık Sertifikası",
    defaultCertificateTitle: "YAZARLIK SERTİFİKASI",
    defaultEvaluationLabel: "Yayın Basım Tarihi",
    isCustom: false,
    guidance: "Varsayılan başlık YAZARLIK SERTİFİKASI olarak gelir. Tarih etiketi Yayın Basım Tarihi kullanır.",
  },
  DIGER: {
    type: "DIGER",
    label: "Diğer",
    slug: "diger",
    defaultTemplateName: "Diğer Sertifika",
    defaultCertificateTitle: "ÖZEL SERTİFİKA",
    defaultEvaluationLabel: "İlgili Tarih",
    isCustom: true,
    guidance: "Diğer şablonu tamamen serbesttir. Başlık, metinler ve etiketler ihtiyaca göre düzenlenebilir.",
  },
};

const CERTIFICATE_TYPE_ORDER: CertificateType[] = ["HAKEMLIK", "EDITORLUK", "YAZARLIK", "DIGER"];

export function isCertificateType(value: string): value is CertificateType {
  return CERTIFICATE_TYPE_ORDER.includes(value as CertificateType);
}

export function getCertificateTypeOrder() {
  return CERTIFICATE_TYPE_ORDER.slice();
}

export function getCertificatePreset(type: CertificateType) {
  return CERTIFICATE_PRESETS[type];
}

export function getCertificateTypeLabel(type: CertificateType) {
  return getCertificatePreset(type).label;
}

export function getCertificateTypeSlug(type: CertificateType) {
  return getCertificatePreset(type).slug;
}

export function getDefaultCertificateTitle(type: CertificateType) {
  return getCertificatePreset(type).defaultCertificateTitle;
}

export function getDefaultEvaluationLabel(type: CertificateType) {
  return getCertificatePreset(type).defaultEvaluationLabel;
}

export function getDefaultTemplateName(type: CertificateType) {
  return getCertificatePreset(type).defaultTemplateName;
}

export function isCustomTemplateType(type: CertificateType) {
  return getCertificatePreset(type).isCustom;
}

export function getPresetGuidance(type: CertificateType) {
  return getCertificatePreset(type).guidance;
}

export function sortTemplatesByType<T extends { type: CertificateType }>(templates: T[]) {
  const order = new Map(getCertificateTypeOrder().map((type, index) => [type, index]));
  return [...templates].sort((left, right) => {
    const leftIndex = order.get(left.type) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = order.get(right.type) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}
