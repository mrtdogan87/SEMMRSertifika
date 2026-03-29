import { CertificateStatus, type CertificateType } from "@prisma/client";
import { resolveLayoutConfig } from "@/lib/certificate-layouts";
import { isCertificateType, isCustomTemplateType, sortTemplatesByType } from "@/lib/certificate-presets";
import { prisma } from "@/lib/prisma";
import { parseDateSmart, asRecord, isValidEmail } from "@/lib/utils";
import type {
  CertificateDetailView,
  CertificateFormInput,
  CertificateListFilters,
} from "@/types/certificate";
import { generateCertificatePdf } from "@/lib/pdf";
import { writeCertificatePdf, readCertificatePdf, deleteCertificatePdf } from "@/lib/storage";
import { buildEmailContent, sendCertificateEmail } from "@/lib/email";
import { validateTemplatePlaceholders } from "@/lib/placeholders";
import { getDefaultTemplateSeed, getDefaultTemplateSeeds } from "@/lib/templates";
import { getDefaultTemplateName, getCertificateTypeLabel } from "@/lib/certificate-presets";

function parseJsonString(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

async function ensureDefaultTemplates() {
  const seeds = getDefaultTemplateSeeds();

  await Promise.all(
    seeds.map((template) =>
      prisma.certificateTemplate.upsert({
        where: { type: template.type },
        update: {
          name: template.name,
          isActive: template.isActive,
          backgroundPath: template.backgroundPath,
          subjectTemplate: template.subjectTemplate,
          bodyTemplate: template.bodyTemplate,
          certificateTextTemplate: template.certificateTextTemplate,
          layoutConfigJson: template.layoutConfigJson,
        },
        create: template,
      }),
    ),
  );
}

function resolveTemplateCertificateTitle(template: {
  type: CertificateType;
  layoutConfigJson: string;
}) {
  return resolveLayoutConfig(template.type, template.layoutConfigJson).defaults.certificateTitle.trim();
}

function resolveRecordCertificateTitle(
  template: { type: CertificateType; layoutConfigJson: string },
  inputTitle: string,
) {
  const explicitTitle = inputTitle.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const fallbackTitle = resolveTemplateCertificateTitle(template);
  if (fallbackTitle) {
    return fallbackTitle;
  }

  if (isCustomTemplateType(template.type)) {
    throw new Error("Diğer şablonunda Sertifika Başlığı zorunludur.");
  }

  return "";
}

export function normalizeFilters(input?: Partial<CertificateListFilters>): CertificateListFilters {
  const rawType = String(input?.type ?? "");
  const status = input?.status;

  return {
    q: String(input?.q ?? "").trim(),
    type: isCertificateType(rawType) ? rawType : "ALL",
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
  await ensureDefaultTemplates();
  const templates = await prisma.certificateTemplate.findMany({
    orderBy: { createdAt: "asc" },
  });
  return sortTemplatesByType(
    templates.map((template) => {
      const defaults = getDefaultTemplateSeed(template.type);
      return {
        ...template,
        name: getDefaultTemplateName(template.type),
        subjectTemplate: template.subjectTemplate.trim() || defaults.subjectTemplate,
        bodyTemplate: template.bodyTemplate.trim() || defaults.bodyTemplate,
        certificateTextTemplate:
          template.certificateTextTemplate.trim() || defaults.certificateTextTemplate,
      };
    }),
  );
}

export async function createCertificateRecord(input: CertificateFormInput) {
  await ensureDefaultTemplates();
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: input.templateId },
  });

  if (!template) {
    throw new Error("Sertifika şablonu bulunamadı.");
  }

  if (!input.fullName.trim() || !input.email.trim() || !input.articleTitle.trim()) {
    throw new Error("Ad Soyad, E-posta ve Makale Adı alanları zorunludur.");
  }

  if (!isValidEmail(input.email)) {
    throw new Error("Geçerli bir e-posta adresi girilmelidir.");
  }

  return prisma.certificateRecord.create({
    data: {
      templateId: template.id,
      type: template.type,
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      eventName: input.articleTitle.trim(),
      eventDate: parseDateSmart(input.date),
      organizer: resolveRecordCertificateTitle(template, input.certificateTitle),
      customFieldsJson: JSON.stringify({
        articleId: input.articleId?.trim() ?? "",
        evaluationDate: input.evaluationDate?.trim() ?? "",
      }),
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
              { fullName: { contains: filters.q } },
              { email: { contains: filters.q } },
              { eventName: { contains: filters.q } },
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

  const custom = asRecord(parseJsonString(record.customFieldsJson));

  return {
    id: record.id,
    type: record.type,
    status: record.status,
    fullName: record.fullName,
    email: record.email,
    articleTitle: record.eventName,
    date: record.eventDate?.toISOString() ?? "",
    certificateTitle: record.organizer,
    customFields: {
      articleId: String(custom.articleId ?? ""),
      evaluationDate: String(custom.evaluationDate ?? ""),
    },
    pdfPath: record.pdfPath,
    pdfFileSize: record.pdfFileSize,
    lastError: record.lastError,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    template: {
      id: record.template.id,
      name: record.template.name,
      displayName: getCertificateTypeLabel(record.template.type),
      backgroundPath: record.template.backgroundPath,
      subjectTemplate: record.template.subjectTemplate,
      bodyTemplate: record.template.bodyTemplate,
      certificateTextTemplate: record.template.certificateTextTemplate,
      layoutConfigJson: record.template.layoutConfigJson,
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

  let writtenPdfPath: string | null = null;

  try {
    validateTemplatePlaceholders(record.template.subjectTemplate);
    validateTemplatePlaceholders(record.template.bodyTemplate);
    validateTemplatePlaceholders(record.template.certificateTextTemplate);

    const customFields = asRecord(parseJsonString(record.customFieldsJson));
    const generated = await generateCertificatePdf({
      type: record.type,
      fullName: record.fullName,
      email: record.email,
      articleTitle: record.eventName,
      date: record.eventDate,
      certificateTitle: record.organizer,
      customFields: {
        articleId: String(customFields.articleId ?? ""),
        evaluationDate: String(customFields.evaluationDate ?? ""),
      },
      backgroundPath: record.template.backgroundPath,
      certificateTextTemplate: record.template.certificateTextTemplate,
      layoutConfigJson: parseJsonString(record.template.layoutConfigJson),
    });

    const file = await writeCertificatePdf(record.id, generated.bytes);
    writtenPdfPath = file.relativePath;
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
    const stalePdfPath = writtenPdfPath ?? record.pdfPath;
    const message = error instanceof Error ? error.message : "PDF üretimi başarısız oldu.";

    await prisma.certificateRecord.update({
      where: { id: record.id },
      data: {
        status: CertificateStatus.FAILED,
        pdfPath: null,
        pdfFileSize: null,
        lastError: message,
      },
    });

    if (stalePdfPath) {
      try {
        await deleteCertificatePdf(stalePdfPath);
      } catch {
        // Do not mask the original generation error if stale cleanup fails.
      }
    }

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
  subjectTemplate: string;
  bodyTemplate: string;
  certificateTextTemplate: string;
  layoutConfigJson?: string;
  backgroundPath?: string;
}) {
  await ensureDefaultTemplates();
  const template = await prisma.certificateTemplate.findUnique({
    where: { id: input.id },
    select: { type: true },
  });

  if (!template) {
    throw new Error("Şablon bulunamadı.");
  }

  validateTemplatePlaceholders(input.subjectTemplate);
  validateTemplatePlaceholders(input.bodyTemplate);
  validateTemplatePlaceholders(input.certificateTextTemplate);

  return prisma.certificateTemplate.update({
    where: { id: input.id },
    data: {
      name: getDefaultTemplateName(template.type),
      subjectTemplate: input.subjectTemplate,
      bodyTemplate: input.bodyTemplate,
      certificateTextTemplate: input.certificateTextTemplate,
      ...(input.layoutConfigJson ? { layoutConfigJson: input.layoutConfigJson } : {}),
      ...(input.backgroundPath ? { backgroundPath: input.backgroundPath } : {}),
    },
  });
}

export async function getTemplateByType(type: CertificateType) {
  await ensureDefaultTemplates();
  return prisma.certificateTemplate.findUnique({
    where: { type },
  });
}

export async function deleteCertificateRecord(id: string) {
  const record = await prisma.certificateRecord.findUnique({
    where: { id },
    select: {
      id: true,
      pdfPath: true,
    },
  });

  if (!record) {
    throw new Error("Sertifika kaydı bulunamadı.");
  }

  await prisma.certificateEmailLog.deleteMany({
    where: { certificateRecordId: record.id },
  });

  await prisma.certificateRecord.delete({
    where: { id: record.id },
  });

  if (record.pdfPath) {
    await deleteCertificatePdf(record.pdfPath);
  }
}
