"use client";

import { useRef } from "react";
import type { CertificateType } from "@prisma/client";
import { resolveLayoutConfig, type CertificateLayout, type LayoutAlign } from "@/lib/certificate-layouts";
import { buildPlaceholderValues, fillTemplate } from "@/lib/placeholders";
import type { CertificateCustomFields } from "@/types/certificate";
import { upperTR } from "@/lib/utils";

export const PREVIEW_FIELDS = [
  { key: "name", label: "Ad Soyad" },
  { key: "certificateTitle", label: "Sertifika Başlığı" },
  { key: "message", label: "Açıklama Metni" },
  { key: "date", label: "Sertifika Tarihi" },
  { key: "articleId", label: "Makale ID" },
  { key: "evaluationDate", label: "Değerlendirme / Yayın Tarihi" },
] as const;

const PREVIEW_DISPLAY_WIDTH = 720;

type PreviewFieldKey = (typeof PREVIEW_FIELDS)[number]["key"];

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

function toPercent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function getAlignmentStyles(align: LayoutAlign) {
  if (align === "left") {
    return { transform: "none", textAlign: "left" as const };
  }

  if (align === "right") {
    return { transform: "translateX(-100%)", textAlign: "right" as const };
  }

  return { transform: "translateX(-50%)", textAlign: "center" as const };
}

function renderLabelValue(
  label: { text: string; fontSize: number; bold: boolean },
  value: string,
  valueFontSize: number,
) {
  return (
    <span className="certificate-preview-inline">
      <span
        className="certificate-preview-inline-label"
        style={{
          fontSize: `${label.fontSize}px`,
          fontWeight: label.bold ? 700 : 400,
        }}
      >
        {label.text}:
      </span>
      <span
        className="certificate-preview-inline-value"
        style={{
          fontSize: `${valueFontSize}px`,
        }}
      >
        {value}
      </span>
    </span>
  );
}

export function parseLayoutConfig(value: unknown, type: CertificateType) {
  return resolveLayoutConfig(type, value);
}

export function CertificateVisualPreview(props: {
  type: CertificateType;
  backgroundPath: string;
  certificateTextTemplate: string;
  layoutConfigJson: unknown;
  previewMode?: "sample" | "labels";
  editable?: boolean;
  activeField?: PreviewFieldKey;
  onActiveFieldChange?: (field: PreviewFieldKey) => void;
  onLayoutChange?: (layout: CertificateLayout) => void;
  fullName?: string;
  email?: string;
  articleTitle?: string;
  certificateTitle?: string;
  date?: Date | null;
  customFields?: CertificateCustomFields;
}) {
  const previewMode = props.previewMode ?? "sample";
  const layout = parseLayoutConfig(props.layoutConfigJson, props.type);
  const labelMode = previewMode === "labels";
  const fullName = props.fullName ?? (labelMode ? "Ad Soyad" : "ÇAĞRI IŞIK");
  const articleTitle =
    props.articleTitle ?? (labelMode ? "Makale Adı" : "Yapay Zeka Destekli Hakemlik Süreçlerinin Etkinliği");
  const certificateTitle =
    props.certificateTitle ?? (labelMode ? "Sertifika Başlığı" : layout.defaults.certificateTitle);
  const date = props.date ?? new Date("2026-03-27T00:00:00+03:00");
  const customFields = props.customFields ?? {
    articleId: labelMode ? "Değer" : "SEMMR-2026-0142",
    evaluationDate: labelMode ? "Değer" : "27.03.2026",
  };
  const shellRef = useRef<HTMLDivElement | null>(null);

  const values = buildPlaceholderValues({
    fullName,
    email: props.email ?? (labelMode ? "E-posta" : "ornek@semmrjournal.com"),
    articleTitle,
    date,
    certificateTitle,
    type: props.type,
    customFields,
  });
  if (labelMode) {
    values.TARIH = "Tarih";
  }
  const message = fillTemplate(props.certificateTextTemplate, values);
  const lines = wrapText(message, 52);
  const nameSize = fullName.length > 28 ? 25 : layout.name.size;
  const dateText = values.TARIH;
  const articleIdText = values.MAKALE_ID;
  const evaluationDateText = values.DEGERLENDIRME_TARIHI;

  function startDrag(field: PreviewFieldKey) {
    if (!props.editable || !props.onLayoutChange) {
      return undefined;
    }

    return (event: React.PointerEvent<HTMLDivElement>) => {
      const shell = shellRef.current;
      if (!shell) {
        return;
      }

      props.onActiveFieldChange?.(field);
      event.preventDefault();

      const rect = shell.getBoundingClientRect();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const move = (clientX: number, clientY: number) => {
        const x = Math.max(0, Math.min(layout.pageWidth, ((clientX - rect.left) / rect.width) * layout.pageWidth));
        const y = Math.max(0, Math.min(layout.pageHeight, ((clientY - rect.top) / rect.height) * layout.pageHeight));

        props.onLayoutChange?.({
          ...layout,
          [field]: {
            ...layout[field],
            x: Math.round(x),
            y: Math.round(y),
          },
        });
      };

      move(event.clientX, event.clientY);

      const onPointerMove = (pointerEvent: PointerEvent) => {
        move(pointerEvent.clientX, pointerEvent.clientY);
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };
  }

  function editableClass(field: PreviewFieldKey) {
    return [
      props.editable ? "certificate-preview-editable" : "",
      props.activeField === field ? "certificate-preview-active" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <div className="certificate-preview-shell" ref={shellRef}>
      <div
        className="certificate-preview"
        style={{
          backgroundImage: `url(${props.backgroundPath})`,
          width: `${PREVIEW_DISPLAY_WIDTH}px`,
          height: `${Math.round((layout.pageHeight / layout.pageWidth) * PREVIEW_DISPLAY_WIDTH)}px`,
        }}
      >
        <div
          className={`certificate-preview-text ${editableClass("certificateTitle")}`}
          style={{
            top: toPercent(layout.certificateTitle.y, layout.pageHeight),
            left: toPercent(layout.certificateTitle.x, layout.pageWidth),
            fontSize: `${layout.certificateTitle.size}px`,
            ...getAlignmentStyles(layout.certificateTitle.align),
          }}
          onPointerDown={startDrag("certificateTitle")}
        >
          {certificateTitle}
        </div>

        <div
          className={`certificate-preview-text certificate-preview-name ${editableClass("name")}`}
          style={{
            top: toPercent(layout.name.y, layout.pageHeight),
            left: toPercent(layout.name.x, layout.pageWidth),
            fontSize: `${nameSize}px`,
            ...getAlignmentStyles(layout.name.align),
          }}
          onPointerDown={startDrag("name")}
        >
          {labelMode ? fullName : upperTR(fullName)}
        </div>

        <div
          className={`certificate-preview-text certificate-preview-message ${editableClass("message")}`}
          style={{
            top: toPercent(layout.message.y, layout.pageHeight),
            left: toPercent(layout.message.x, layout.pageWidth),
            width: toPercent(layout.message.width, layout.pageWidth),
            fontSize: `${layout.message.size}px`,
            lineHeight: `${layout.message.lineHeight}px`,
            ...getAlignmentStyles(layout.message.align),
          }}
          onPointerDown={startDrag("message")}
        >
          {lines.map((line, index) => (
            <div key={`${line}-${index}`}>{line}</div>
          ))}
        </div>

        <div
          className={`certificate-preview-text ${editableClass("date")}`}
          style={{
            top: toPercent(layout.date.y, layout.pageHeight),
            left: toPercent(layout.date.x, layout.pageWidth),
            fontSize: `${layout.date.size}px`,
            ...getAlignmentStyles(layout.date.align),
          }}
          onPointerDown={startDrag("date")}
        >
          {renderLabelValue(layout.labels.date, dateText, layout.date.size)}
        </div>

        {articleIdText ? (
          <div
            className={`certificate-preview-text ${editableClass("articleId")}`}
            style={{
              top: toPercent(layout.articleId.y, layout.pageHeight),
              left: toPercent(layout.articleId.x, layout.pageWidth),
              fontSize: `${layout.articleId.size}px`,
              ...getAlignmentStyles(layout.articleId.align),
            }}
            onPointerDown={startDrag("articleId")}
          >
            {renderLabelValue(layout.labels.articleId, articleIdText, layout.articleId.size)}
          </div>
        ) : null}

        {evaluationDateText ? (
          <div
            className={`certificate-preview-text ${editableClass("evaluationDate")}`}
            style={{
              top: toPercent(layout.evaluationDate.y, layout.pageHeight),
              left: toPercent(layout.evaluationDate.x, layout.pageWidth),
              fontSize: `${layout.evaluationDate.size}px`,
              ...getAlignmentStyles(layout.evaluationDate.align),
            }}
            onPointerDown={startDrag("evaluationDate")}
          >
            {renderLabelValue(layout.labels.evaluationDate, evaluationDateText, layout.evaluationDate.size)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
