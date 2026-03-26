import { Resend } from "resend";
import type { CertificateRecord, CertificateTemplate } from "@prisma/client";
import { getResendConfig } from "@/lib/config";
import { buildPlaceholderValues, fillTemplate } from "@/lib/placeholders";
import { asRecord } from "@/lib/utils";

function getResendClient() {
  const config = getResendConfig();
  if (!config.apiKey || !config.senderEmail) {
    return null;
  }

  return {
    resend: new Resend(config.apiKey),
    sender: `${config.senderName} <${config.senderEmail}>`,
  };
}

export function buildEmailContent(record: CertificateRecord, template: CertificateTemplate) {
  const customFields = asRecord(record.customFieldsJson);
  const values = buildPlaceholderValues({
    fullName: record.fullName,
    email: record.email,
    eventName: record.eventName,
    eventDate: record.eventDate,
    organizer: record.organizer,
    type: record.type,
    customFields: {
      ozel1: String(customFields.ozel1 ?? ""),
      ozel2: String(customFields.ozel2 ?? ""),
      ozel3: String(customFields.ozel3 ?? ""),
    },
  });

  return {
    subject: fillTemplate(template.subjectTemplate, values),
    body: fillTemplate(template.bodyTemplate, values),
  };
}

export async function sendCertificateEmail(params: {
  record: CertificateRecord;
  template: CertificateTemplate;
  attachment: Buffer;
}) {
  const client = getResendClient();
  if (!client) {
    throw new Error("Resend yapılandırması eksik.");
  }

  const content = buildEmailContent(params.record, params.template);
  const response = await client.resend.emails.send({
    from: client.sender,
    to: [params.record.email],
    subject: content.subject,
    text: content.body,
    attachments: [
      {
        filename: `${params.record.fullName}.pdf`,
        content: params.attachment,
      },
    ],
  });

  return {
    subject: content.subject,
    body: content.body,
    providerMessageId: response.data?.id ?? null,
  };
}
