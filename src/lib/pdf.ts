import fs from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import type { CertificateType } from "@prisma/client";
import { resolveLayoutConfig, type LabelConfig, type LayoutAlign } from "@/lib/certificate-layouts";
import { getCertificateFontPaths } from "@/lib/config";
import { buildPlaceholderValues, fillTemplate } from "@/lib/placeholders";
import type { CertificateCustomFields } from "@/types/certificate";
import { upperTR } from "@/lib/utils";

const FONT_CANDIDATES = {
  regular: [
    "assets/fonts/DejaVuSans.ttf",
    "assets/fonts/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSans-Regular.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
  ],
  bold: [
    "assets/fonts/DejaVuSans-Bold.ttf",
    "assets/fonts/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/opentype/noto/NotoSans-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  ],
} as const;

function topToPdfY(pageHeight: number, top: number, fontSize: number) {
  return pageHeight - top - fontSize;
}

function resolveAlignedX(anchorX: number, align: LayoutAlign, contentWidth: number) {
  if (align === "right") {
    return anchorX - contentWidth;
  }

  if (align === "center") {
    return anchorX - contentWidth / 2;
  }

  return anchorX;
}

function drawAnchoredText(params: {
  page: PDFDocument["addPage"] extends (...args: never[]) => infer R ? R : never;
  text: string;
  x: number;
  top: number;
  size: number;
  font: Awaited<ReturnType<typeof embedUnicodeFonts>>["regular"] | Awaited<ReturnType<typeof embedUnicodeFonts>>["bold"];
  color: ReturnType<typeof rgb>;
  pageHeight: number;
  align: LayoutAlign;
}) {
  const textWidth = params.font.widthOfTextAtSize(params.text, params.size);
  params.page.drawText(params.text, {
    x: resolveAlignedX(params.x, params.align, textWidth),
    y: topToPdfY(params.pageHeight, params.top, params.size),
    size: params.size,
    font: params.font,
    color: params.color,
  });
}

function drawAnchoredLabelValue(params: {
  page: PDFDocument["addPage"] extends (...args: never[]) => infer R ? R : never;
  label: LabelConfig;
  value: string;
  x: number;
  top: number;
  valueSize: number;
  regularFont: Awaited<ReturnType<typeof embedUnicodeFonts>>["regular"];
  boldFont: Awaited<ReturnType<typeof embedUnicodeFonts>>["bold"];
  color: ReturnType<typeof rgb>;
  pageHeight: number;
  align: LayoutAlign;
}) {
  const labelText = `${params.label.text}: `;
  const labelFont = params.label.bold ? params.boldFont : params.regularFont;
  const labelWidth = labelFont.widthOfTextAtSize(labelText, params.label.fontSize);
  const valueWidth = params.regularFont.widthOfTextAtSize(params.value, params.valueSize);
  const totalWidth = labelWidth + valueWidth;
  const startX = resolveAlignedX(params.x, params.align, totalWidth);
  const labelHeight = labelFont.heightAtSize(params.label.fontSize);
  const valueHeight = params.regularFont.heightAtSize(params.valueSize);
  const maxHeight = Math.max(labelHeight, valueHeight);
  const baselineY = params.pageHeight - params.top - maxHeight;

  params.page.drawText(labelText, {
    x: startX,
    y: baselineY,
    size: params.label.fontSize,
    font: labelFont,
    color: params.color,
  });

  params.page.drawText(params.value, {
    x: startX + labelWidth,
    y: baselineY,
    size: params.valueSize,
    font: params.regularFont,
    color: params.color,
  });
}

function drawAlignedParagraph(params: {
  page: PDFDocument["addPage"] extends (...args: never[]) => infer R ? R : never;
  lines: string[];
  x: number;
  top: number;
  size: number;
  font: Awaited<ReturnType<typeof embedUnicodeFonts>>["regular"];
  color: ReturnType<typeof rgb>;
  pageHeight: number;
  width: number;
  lineHeight: number;
  align: LayoutAlign;
}) {
  const boxLeft = resolveAlignedX(params.x, params.align, params.width);

  params.lines.forEach((line, index) => {
    const lineWidth = params.font.widthOfTextAtSize(line, params.size);
    const lineX =
      params.align === "left"
        ? boxLeft
        : params.align === "right"
          ? boxLeft + params.width - lineWidth
          : boxLeft + (params.width - lineWidth) / 2;

    params.page.drawText(line, {
      x: lineX,
      y: topToPdfY(params.pageHeight, params.top + index * params.lineHeight, params.size),
      size: params.size,
      font: params.font,
      color: params.color,
      maxWidth: params.width,
    });
  });
}

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
  const isRemote = /^https?:\/\//i.test(backgroundPath);
  let imageBytes: Uint8Array;

  if (isRemote) {
    const response = await fetch(backgroundPath);
    if (!response.ok) {
      throw new Error("Arka plan görseli indirilemedi.");
    }

    imageBytes = new Uint8Array(await response.arrayBuffer());
  } else {
    imageBytes = await fs.readFile(path.join(process.cwd(), "public", backgroundPath.replace(/^\//, "")));
  }

  const extension = path.extname(new URL(backgroundPath, "http://localhost").pathname).toLowerCase();

  if (extension === ".png") {
    return pdfDoc.embedPng(imageBytes);
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return pdfDoc.embedJpg(imageBytes);
  }

  throw new Error("Arka plan görseli desteklenmiyor. Sadece PNG, JPG veya JPEG kullanın.");
}

function toAbsoluteFontPath(value: string) {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

async function findReadableFontPath(candidates: string[]) {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const absolutePath = toAbsoluteFontPath(candidate);

    try {
      await fs.access(absolutePath);
      return absolutePath;
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveFontPaths() {
  const configured = getCertificateFontPaths();
  const regularCandidates = configured.regular
    ? [configured.regular, ...FONT_CANDIDATES.regular]
    : [...FONT_CANDIDATES.regular];
  const boldCandidates = configured.bold ? [configured.bold, ...FONT_CANDIDATES.bold] : [...FONT_CANDIDATES.bold];
  const [regularPath, boldPath] = await Promise.all([
    findReadableFontPath(regularCandidates),
    findReadableFontPath(boldCandidates),
  ]);

  if (!regularPath || !boldPath) {
    throw new Error(
      "PDF font dosyalari bulunamadi. CERTIFICATE_FONT_REGULAR_PATH ve CERTIFICATE_FONT_BOLD_PATH ayarlarini tanimlayin veya DejaVu/Liberation/Noto Sans fontlarini sunucuya kurun.",
    );
  }

  return { regularPath, boldPath };
}

async function embedUnicodeFonts(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);
  const { regularPath, boldPath } = await resolveFontPaths();
  const [regularBytes, boldBytes] = await Promise.all([fs.readFile(regularPath), fs.readFile(boldPath)]);

  const [regular, bold] = await Promise.all([
    pdfDoc.embedFont(regularBytes, { subset: true }),
    pdfDoc.embedFont(boldBytes, { subset: true }),
  ]);

  return { regular, bold };
}

export async function generateCertificatePdf(params: {
  type: CertificateType;
  fullName: string;
  email: string;
  articleTitle: string;
  date: Date | null;
  certificateTitle: string;
  customFields: CertificateCustomFields;
  backgroundPath: string;
  certificateTextTemplate: string;
  layoutConfigJson: unknown;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { regular: font, bold: fontBold } = await embedUnicodeFonts(pdfDoc);
  const background = await embedBackground(pdfDoc, params.backgroundPath);
  const layout = resolveLayoutConfig(params.type, params.layoutConfigJson);

  page.drawImage(background, {
    x: layout.backgroundInset,
    y: layout.backgroundInset,
    width: layout.pageWidth - layout.backgroundInset * 2,
    height: layout.pageHeight - layout.backgroundInset * 2,
  });

  const values = buildPlaceholderValues({
    fullName: params.fullName,
    email: params.email,
    articleTitle: params.articleTitle,
    date: params.date,
    certificateTitle: params.certificateTitle,
    type: params.type,
    customFields: params.customFields,
  });

  const message = fillTemplate(params.certificateTextTemplate, values);
  const messageLines = wrapText(message, 52);
  const nameSize = params.fullName.length > 28 ? 25 : layout.name.size;
  const dateText = values.TARIH;
  const articleIdText = values.MAKALE_ID;
  const evaluationDateText = values.DEGERLENDIRME_TARIHI;

  if (params.certificateTitle.trim()) {
    drawAnchoredText({
      page,
      text: params.certificateTitle,
      x: layout.certificateTitle.x,
      top: layout.certificateTitle.y,
      size: layout.certificateTitle.size,
      font: fontBold,
      color: rgb(0.12, 0.12, 0.12),
      pageHeight: layout.pageHeight,
      align: layout.certificateTitle.align,
    });
  }

  drawAnchoredText({
    page,
    text: upperTR(params.fullName),
    x: layout.name.x,
    top: layout.name.y,
    size: nameSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
    pageHeight: layout.pageHeight,
    align: layout.name.align,
  });

  drawAlignedParagraph({
    page,
    lines: messageLines,
    x: layout.message.x,
    top: layout.message.y,
    size: layout.message.size,
    font,
    color: rgb(0.12, 0.12, 0.12),
    pageHeight: layout.pageHeight,
    width: layout.message.width,
    lineHeight: layout.message.lineHeight,
    align: layout.message.align,
  });

  drawAnchoredLabelValue({
    page,
    label: layout.labels.date,
    value: dateText,
    x: layout.date.x,
    top: layout.date.y,
    valueSize: layout.date.size,
    regularFont: font,
    boldFont: fontBold,
    color: rgb(0.12, 0.12, 0.12),
    pageHeight: layout.pageHeight,
    align: layout.date.align,
  });

  if (articleIdText) {
    drawAnchoredLabelValue({
      page,
      label: layout.labels.articleId,
      value: articleIdText,
      x: layout.articleId.x,
      top: layout.articleId.y,
      valueSize: layout.articleId.size,
      regularFont: font,
      boldFont: fontBold,
      color: rgb(0.12, 0.12, 0.12),
      pageHeight: layout.pageHeight,
      align: layout.articleId.align,
    });
  }

  if (evaluationDateText) {
    drawAnchoredLabelValue({
      page,
      label: layout.labels.evaluationDate,
      value: evaluationDateText,
      x: layout.evaluationDate.x,
      top: layout.evaluationDate.y,
      valueSize: layout.evaluationDate.size,
      regularFont: font,
      boldFont: fontBold,
      color: rgb(0.12, 0.12, 0.12),
      pageHeight: layout.pageHeight,
      align: layout.evaluationDate.align,
    });
  }

  const bytes = await pdfDoc.save();
  return {
    bytes,
    warning: bytes.byteLength > 2 * 1024 * 1024 ? "PDF boyutu 2 MB hedefini aştı." : null,
  };
}
