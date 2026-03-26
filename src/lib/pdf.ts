import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CertificateType } from "@prisma/client";
import { getDefaultLayout, type CertificateLayout } from "@/lib/certificate-layouts";
import { buildPlaceholderValues, fillTemplate } from "@/lib/placeholders";
import type { CertificateCustomFields } from "@/types/certificate";
import { upperTR } from "@/lib/utils";

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

async function embedBackground(pdfDoc: PDFDocument, backgroundPath: string) {
  const absolute = path.join(process.cwd(), "public", backgroundPath.replace(/^\//, ""));
  const imageBytes = await fs.readFile(absolute);
  if (backgroundPath.toLowerCase().endsWith(".png")) {
    return pdfDoc.embedPng(imageBytes);
  }

  return pdfDoc.embedJpg(imageBytes);
}

export async function generateCertificatePdf(params: {
  type: CertificateType;
  fullName: string;
  email: string;
  eventName: string;
  eventDate: Date | null;
  organizer: string;
  customFields: CertificateCustomFields;
  backgroundPath: string;
  certificateTextTemplate: string;
  layoutConfigJson: unknown;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const background = await embedBackground(pdfDoc, params.backgroundPath);
  const layout = (params.layoutConfigJson as CertificateLayout | null) ?? getDefaultLayout(params.type);

  page.drawImage(background, {
    x: layout.backgroundInset,
    y: layout.backgroundInset,
    width: layout.pageWidth - layout.backgroundInset * 2,
    height: layout.pageHeight - layout.backgroundInset * 2,
  });

  const values = buildPlaceholderValues({
    fullName: params.fullName,
    email: params.email,
    eventName: params.eventName,
    eventDate: params.eventDate,
    organizer: params.organizer,
    type: params.type,
    customFields: params.customFields,
  });

  const message = fillTemplate(params.certificateTextTemplate, values);
  const messageLines = wrapText(message, 52);
  const nameSize = params.fullName.length > 28 ? 25 : layout.name.size;
  const eventSize = params.eventName.length > 38 ? 16 : layout.event.size;

  page.drawText(upperTR(params.fullName), {
    x: layout.name.x - fontBold.widthOfTextAtSize(upperTR(params.fullName), nameSize) / 2,
    y: layout.name.y,
    size: nameSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  messageLines.forEach((line, index) => {
    page.drawText(line, {
      x: layout.message.x - font.widthOfTextAtSize(line, layout.message.size) / 2,
      y: layout.message.y - index * layout.message.lineHeight,
      size: layout.message.size,
      font,
      color: rgb(0.12, 0.12, 0.12),
      maxWidth: layout.message.width,
    });
  });

  page.drawText(params.eventName, {
    x: layout.event.x - fontBold.widthOfTextAtSize(params.eventName, eventSize) / 2,
    y: layout.event.y,
    size: eventSize,
    font: fontBold,
    color: rgb(0.12, 0.12, 0.12),
  });

  const dateLabel = values.TARIH;
  page.drawText(dateLabel, {
    x: layout.date.x - font.widthOfTextAtSize(dateLabel, layout.date.size) / 2,
    y: layout.date.y,
    size: layout.date.size,
    font,
    color: rgb(0.12, 0.12, 0.12),
  });

  if (params.organizer.trim()) {
    page.drawText(params.organizer, {
      x: layout.organizer.x - font.widthOfTextAtSize(params.organizer, layout.organizer.size) / 2,
      y: layout.organizer.y,
      size: layout.organizer.size,
      font,
      color: rgb(0.12, 0.12, 0.12),
    });
  }

  const bytes = await pdfDoc.save();
  return {
    bytes,
    warning: bytes.byteLength > 1024 * 1024 ? "PDF boyutu 1 MB hedefini aştı." : null,
  };
}
