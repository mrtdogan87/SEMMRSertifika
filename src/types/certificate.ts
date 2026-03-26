import type { CertificateStatus, CertificateType, EmailActionType } from "@prisma/client";

export type CertificateCustomFields = {
  ozel1?: string;
  ozel2?: string;
  ozel3?: string;
};

export type CertificateFormInput = {
  templateId: string;
  type: CertificateType;
  fullName: string;
  email: string;
  eventName: string;
  eventDate: string;
  organizer: string;
  ozel1?: string;
  ozel2?: string;
  ozel3?: string;
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
  ETKINLIK: string;
  TARIH: string;
  DUZENLEYICI: string;
  EPOSTA: string;
  SERTIFIKA_TURU: string;
  OZEL_1: string;
  OZEL_2: string;
  OZEL_3: string;
};

export type CertificateDetailView = {
  id: string;
  type: CertificateType;
  status: CertificateStatus;
  fullName: string;
  email: string;
  eventName: string;
  eventDate: string;
  organizer: string;
  customFields: CertificateCustomFields;
  pdfPath: string | null;
  pdfFileSize: number | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
    backgroundPath: string;
    subjectTemplate: string;
    bodyTemplate: string;
    certificateTextTemplate: string;
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
