import type { CertificateStatus, CertificateType, EmailActionType } from "@prisma/client";

export type CertificateCustomFields = {
  articleId?: string;
  evaluationDate?: string;
};

export type CertificateFormInput = {
  templateId: string;
  fullName: string;
  email: string;
  articleTitle: string;
  date: string;
  certificateTitle: string;
  articleId?: string;
  evaluationDate?: string;
};

export type CertificateListFilters = {
  q: string;
  type: CertificateType | "ALL";
  status: CertificateStatus | "ALL";
  dateFrom: string;
  dateTo: string;
};

export type PlaceholderValues = {
  AD: string;
  SERTIFIKA_BASLIGI: string;
  MAKALE_ADI: string;
  TARIH: string;
  MAKALE_ID: string;
  DEGERLENDIRME_TARIHI: string;
  EPOSTA: string;
  SERTIFIKA_TURU: string;
};

export type CertificateDetailView = {
  id: string;
  type: CertificateType;
  status: CertificateStatus;
  fullName: string;
  email: string;
  articleTitle: string;
  date: string;
  certificateTitle: string;
  customFields: CertificateCustomFields;
  pdfPath: string | null;
  pdfFileSize: number | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    displayName: string;
    backgroundPath: string;
    subjectTemplate: string;
    bodyTemplate: string;
    certificateTextTemplate: string;
    layoutConfigJson?: string;
  };
  emailLogs: Array<{
    id: string;
    actionType: EmailActionType;
    recipient: string;
    subject: string;
    body: string;
    status: string;
    errorMessage: string | null;
    createdAt: string;
  }>;
};
