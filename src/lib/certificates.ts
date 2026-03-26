import { CertificateStatus, type CertificateType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseDateSmart, asRecord, isValidEmail } from "@/lib/utils";
import type {
  CertificateDetailView,
  CertificateFormInput,
  CertificateListFilters,
} from "@/types/certificate";
import { generateCertificatePdf } from "@/lib/pdf";
import { writeCertificatePdf, readCertificatePdf } from "@/lib/storage";
import { buildEmailContent, sendCertificateEmail } from "@/lib/email";
import { validateTemplatePlaceholders } from "@/lib/placeholders";

export function normalizeFilters(input?: Partial<CertificateListFilters>): CertificateListFilters {
  const type = input?.type;
  const status = input?.status;

  return {
    q: String(input?.q ?? "").trim(),
    type: type === "HAKEMLIK" || type === "REKTORLUK" || type === "YAZARLIK" ? type : "ALL",
    status:
      status === "DRAFT" ||
      status === "GENERATED" ||
      status === "DRAFTED_EMAIL" ||
      status === "SENT" ||
      status === "FAILED"
        ? status
        : "ALL",
    dateFrom: String(input?.dateFrom ?? ""),
    dateTo: String(input?.dateTo ?? ""),
  };
}

export async function listCertificateTemplates() {
  return prisma.certificateTemplate.findMany({
    orderBy: { createdAt: "asc" },
  });
}

export async function createCertificateRecord(input: CertificateFormInput) {
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: input.templateId },
  });

  if (!template) {
    throw new Error("Sertifika şablonu bulunamadı.");
  }

  if (!input.fullName.trim() || !input.email.trim() || !input.eventName.trim()) {
    throw new Error("Ad Soyad, E-posta ve Etkinlik alanları zorunludur.");
  }

  return prisma.certificateRecord.create({
    data: {
      templateId: template.id,
      type: template.type,
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      eventName: input.eventName.trim(),
      eventDate: parseDateSmart(input.eventDate),
      organizer: input.organizer.trim(),
      customFieldsJson: {
        ozel1: input.ozel1?.trim() ?? "",
        ozel2: input.ozel2?.trim() ?? "",
        ozel3: input.ozel3?.trim() ?? "",
      },
    },
  });
}

export async function bulkCreateCertificateRecords(items: CertificateFormInput[]) {
  const created = [];
  for (const item of items) {
    created.push(await createCertificateRecord(item));
  }
  return created;
}

export async function getCertificateList(input?: Partial<CertificateListFilters>) {
  const filters = normalizeFilters(input);
  const dateFrom = parseDateSmart(filters.dateFrom);
  const dateTo = parseDateSmart(filters.dateTo);

  return prisma.certificateRecord.findMany({
    where: {
      ...(filters.type !== "ALL" ? { type: filters.type } : {}),
      ...(filters.status !== "ALL" ? { status: filters.status } : {}),
      ...(filters.q
        ? {
            OR: [
              { fullName: { contains: filters.q, mode: "insensitive" } },
              { email: { contains: filters.q, mode: "insensitive" } },
              { eventName: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(dateFrom || dateTo
        ? {
            eventDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
    include: {
      template: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCertificateDetail(id: string): Promise<CertificateDetailView | null> {
  const record = await prisma.certificateRecord.findUnique({
    where: { id },
    include: {
      template: true,
      emailLogs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!record) {
    return null;
  }

  const custom = asRecord(record.customFieldsJson);

  return {
    id: record.id,
    type: record.type,
    status: record.status,
    fullName: record.fullName,
    email: record.email,
    eventName: record.eventName,
    eventDate: record.eventDate?.toISOString() ?? "",
    organizer: record.organizer,
    customFields: {
      ozel1: String(custom.ozel1 ?? ""),
      ozel2: String(custom.ozel2 ?? ""),
      ozel3: String(custom.ozel3 ?? ""),
    },
    pdfPath: record.pdfPath,
    pdfFileSize: record.pdfFileSize,
    lastError: record.lastError,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    template: {
      id: record.template.id,
      name: record.template.name,
      backgroundPath: record.template.backgroundPath,
      subjectTemplate: record.template.subjectTemplate,
      bodyTemplate: record.template.bodyTemplate,
      certificateTextTemplate: record.template.certificateTextTemplate,
    },
    emailLogs: record.emailLogs.map((log) => ({
      id: log.id,
      actionType: log.actionType,
      recipient: log.recipient,
      subject: log.subject,
      body: log.body,
      status: log.status,
      errorMessage: log.errorMessage,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function generateCertificateForRecord(id: string) {
  const record = await prisma.certificateRecord.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!record) {
    throw new Error("Sertifika kaydı bulunamadı.");
  }

  try {
    validateTemplatePlaceholders(record.template.subjectTemplate);
    validateTemplatePlaceholders(record.template.bodyTemplate);
    validateTemplatePlaceholders(record.template.certificateTextTemplate);

    const customFields = asRecord(record.customFieldsJson);
    const generated = await generateCertificatePdf({
      type: record.type,
      fullName: record.fullName,
      email: record.email,
      eventName: record.eventName,
      eventDate: record.eventDate,
      organizer: record.organizer,
      customFields: {
        ozel1: String(customFields.ozel1 ?? ""),
        ozel2: String(customFields.ozel2 ?? ""),
        ozel3: String(customFields.ozel3 ?? ""),
      },
      backgroundPath: record.template.backgroundPath,
      certificateTextTemplate: record.template.certificateTextTemplate,
      layoutConfigJson: record.template.layoutConfigJson,
    });

    const file = await writeCertificatePdf(record.id, generated.bytes);
    const warning = generated.warning;

    return prisma.certificateRecord.update({
      where: { id: record.id },
      data: {
        status: CertificateStatus.GENERATED,
        pdfPath: file.relativePath,
        pdfFileSize: file.fileSize,
        lastError: warning,
      },
      include: {
        template: true,
      },
    });
  } catch (error) {
    await prisma.certificateRecord.update({
      where: { id: record.id },
      data: {
        status: CertificateStatus.FAILED,
        lastError: error instanceof Error ? error.message : "PDF üretimi başarısız oldu.",
      },
    });
    throw error;
  }
}

export async function createDraftForRecord(id: string) {
  const record = await prisma.certificateRecord.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!record) {
    throw new Error("Sertifika kaydı bulunamadı.");
  }

  if (!record.pdfPath) {
    throw new Error("Taslak oluşturmadan önce PDF üretmelisiniz.");
  }

  const content = buildEmailContent(record, record.template);
  const status = isValidEmail(record.email) ? "READY" : "BLOCKED";
  const errorMessage = isValidEmail(record.email) ? null : "Geçersiz e-posta adresi.";

  await prisma.certificateEmailLog.create({
    data: {
      certificateRecordId: record.id,
      actionType: "DRAFT",
      recipient: record.email,
      subject: content.subject,
      body: content.body,
      status,
      errorMessage,
    },
  });

  return prisma.certificateRecord.update({
    where: { id: record.id },
    data: {
      status: errorMessage ? CertificateStatus.FAILED : CertificateStatus.DRAFTED_EMAIL,
      lastError: errorMessage,
    },
  });
}

export async function sendRecordEmail(id: string) {
  const record = await prisma.certificateRecord.findUnique({
    where: { id },
    include: { template: true },
  });

  if (!record) {
    throw new Error("Sertifika kaydı bulunamadı.");
  }

  if (!record.pdfPath) {
    throw new Error("Gönderim için önce PDF üretmelisiniz.");
  }

  if (!isValidEmail(record.email)) {
    throw new Error("Geçerli bir e-posta adresi bulunmuyor.");
  }

  try {
    const attachment = await readCertificatePdf(record.pdfPath);
    const sent = await sendCertificateEmail({
      record,
      template: record.template,
      attachment,
    });

    await prisma.certificateEmailLog.create({
      data: {
        certificateRecordId: record.id,
        actionType: "SEND",
        recipient: record.email,
        subject: sent.subject,
        body: sent.body,
        providerMessageId: sent.providerMessageId,
        status: "SENT",
      },
    });

    return prisma.certificateRecord.update({
      where: { id: record.id },
      data: {
        status: CertificateStatus.SENT,
        lastError: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gönderim başarısız oldu.";
    await prisma.certificateEmailLog.create({
      data: {
        certificateRecordId: record.id,
        actionType: "SEND",
        recipient: record.email,
        subject: "",
        body: "",
        status: "FAILED",
        errorMessage: message,
      },
    });

    await prisma.certificateRecord.update({
      where: { id: record.id },
      data: {
        status: CertificateStatus.FAILED,
        lastError: message,
      },
    });

    throw error;
  }
}

export async function updateTemplateSettings(input: {
  id: string;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  certificateTextTemplate: string;
}) {
  validateTemplatePlaceholders(input.subjectTemplate);
  validateTemplatePlaceholders(input.bodyTemplate);
  validateTemplatePlaceholders(input.certificateTextTemplate);

  return prisma.certificateTemplate.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      subjectTemplate: input.subjectTemplate,
      bodyTemplate: input.bodyTemplate,
      certificateTextTemplate: input.certificateTextTemplate,
    },
  });
}

export async function getTemplateByType(type: CertificateType) {
  return prisma.certificateTemplate.findUnique({
    where: { type },
  });
}
