"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { CertificateType } from "@prisma/client";
import { parseLayoutConfig, PREVIEW_FIELDS } from "@/components/certificate-visual-preview";
import type { CertificateLayout, LabelConfig } from "@/lib/certificate-layouts";

const CertificateVisualPreview = dynamic(
  () => import("@/components/certificate-visual-preview").then((mod) => mod.CertificateVisualPreview),
  {
    ssr: false,
    loading: () => (
      <div className="certificate-preview-shell">
        <div className="certificate-preview certificate-preview-loading" />
      </div>
    ),
  },
);

type TemplateSettingsFormProps = {
  template: {
    id: string;
    type: CertificateType;
    name: string;
    backgroundPath: string;
    subjectTemplate: string;
    bodyTemplate: string;
    certificateTextTemplate: string;
    layoutConfigJson: string;
  };
  typeLabel: string;
  presetGuidance: string;
  onDirtyChange?: (dirty: boolean) => void;
};

type SettingsTab = "general" | "layout" | "labels" | "texts";

const SETTINGS_TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "general", label: "Genel" },
  { key: "layout", label: "Yerleşim" },
  { key: "labels", label: "Etiketler" },
  { key: "texts", label: "Metinler" },
];

export function TemplateSettingsForm({
  template,
  typeLabel,
  presetGuidance,
  onDirtyChange,
}: TemplateSettingsFormProps) {
  const initialLayout = useMemo(
    () => parseLayoutConfig(template.layoutConfigJson, template.type),
    [template.layoutConfigJson, template.type],
  );
  const [layout, setLayout] = useState<CertificateLayout>(initialLayout);
  const [activeField, setActiveField] = useState<(typeof PREVIEW_FIELDS)[number]["key"]>("name");
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [subjectTemplate, setSubjectTemplate] = useState(template.subjectTemplate);
  const [bodyTemplate, setBodyTemplate] = useState(template.bodyTemplate);
  const [certificateTextTemplate, setCertificateTextTemplate] = useState(template.certificateTextTemplate);
  const [backgroundFileName, setBackgroundFileName] = useState("");

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        subjectTemplate: template.subjectTemplate,
        bodyTemplate: template.bodyTemplate,
        certificateTextTemplate: template.certificateTextTemplate,
        layout: initialLayout,
      }),
    [initialLayout, template.bodyTemplate, template.certificateTextTemplate, template.subjectTemplate],
  );

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        subjectTemplate,
        bodyTemplate,
        certificateTextTemplate,
        layout,
      }),
    [bodyTemplate, certificateTextTemplate, layout, subjectTemplate],
  );

  const dirty = currentSnapshot !== initialSnapshot || Boolean(backgroundFileName);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function updateFieldPosition(axis: "x" | "y", value: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }

    setLayout((current) => ({
      ...current,
      [activeField]: {
        ...current[activeField],
        [axis]: numeric,
      },
    }));
  }

  function updateFieldMetric(metric: "size" | "width" | "lineHeight", value: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }

    setLayout((current) => {
      if (metric === "width" || metric === "lineHeight") {
        if (activeField !== "message") {
          return current;
        }

        return {
          ...current,
          message: {
            ...current.message,
            [metric]: numeric,
          },
        };
      }

      return {
        ...current,
        [activeField]: {
          ...current[activeField],
          size: numeric,
        },
      };
    });
  }

  function updateFieldAlign(value: "left" | "center" | "right") {
    setLayout((current) => ({
      ...current,
      [activeField]: {
        ...current[activeField],
        align: value,
      },
    }));
  }

  function updateLabel(field: "date" | "articleId" | "evaluationDate", value: string) {
    setLayout((current) => ({
      ...current,
      labels: {
        ...current.labels,
        [field]: {
          ...current.labels[field],
          text: value,
        },
      },
    }));
  }

  function updateLabelStyle(
    field: "date" | "articleId" | "evaluationDate",
    key: keyof Pick<LabelConfig, "fontSize" | "bold">,
    value: string | boolean,
  ) {
    setLayout((current) => ({
      ...current,
      labels: {
        ...current.labels,
        [field]: {
          ...current.labels[field],
          [key]: key === "fontSize" ? Number(value) : value,
        },
      },
    }));
  }

  function updateDefaultCertificateTitle(value: string) {
    setLayout((current) => ({
      ...current,
      defaults: {
        ...current.defaults,
        certificateTitle: value,
      },
    }));
  }

  function resetLayout() {
    setLayout(initialLayout);
  }

  function upsertHiddenField(form: HTMLFormElement, fieldName: string, fieldValue: string) {
    let input = form.querySelector<HTMLInputElement>(`input[data-hidden-field="${fieldName}"]`);

    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = fieldName;
      input.dataset.hiddenField = fieldName;
      form.appendChild(input);
    }

    input.value = fieldValue;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    upsertHiddenField(form, "subjectTemplate", subjectTemplate);
    upsertHiddenField(form, "bodyTemplate", bodyTemplate);
    upsertHiddenField(form, "certificateTextTemplate", certificateTextTemplate);
  }

  return (
    <form
      className="card settings-editor-card"
      action="/api/templates"
      method="POST"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="id" value={template.id} />
      <input type="hidden" name="returnType" value={template.type} />
      <input type="hidden" name="layoutConfigJson" value={JSON.stringify(layout)} />

      <div className="settings-editor-shell">
        <div className="settings-preview-column">
          <h2 className="section-title">
            {typeLabel} Şablonu
          </h2>
          <div className="notice">
            {presetGuidance}
          </div>
          <div className="notice">
            Önizleme üstündeki alanları sürükleyebilirsiniz. Hassas ayar için aktif alanı seçip X ve Y değerlerini değiştirin.
          </div>
          <CertificateVisualPreview
            type={template.type}
            backgroundPath={template.backgroundPath}
            certificateTextTemplate={certificateTextTemplate}
            layoutConfigJson={layout}
            previewMode="labels"
            editable
            activeField={activeField}
            onActiveFieldChange={setActiveField}
            onLayoutChange={setLayout}
          />
        </div>

        <div className="settings-form-column">
          <div className="settings-tab-list" role="tablist" aria-label={`${typeLabel} ayar sekmeleri`}>
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`settings-tab ${activeTab === tab.key ? "settings-tab-active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "general" ? (
            <div className="panel-grid">
              <div className="notice">
                Arka plan dosyası: <span className="mono">{template.backgroundPath}</span>
              </div>
              <div className="field">
                <label htmlFor={`background-${template.id}`}>Yeni Arka Plan Dosyası</label>
                <input
                  id={`background-${template.id}`}
                  name="backgroundFile"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(event) => setBackgroundFileName(event.target.files?.[0]?.name ?? "")}
                />
              </div>
              {backgroundFileName ? (
                <div className="notice">
                  Seçilen dosya: <span className="mono">{backgroundFileName}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === "layout" ? (
            <div className="panel-grid">
              <div className="notice">
                Önizlemede gerçek kişi verileri yerine sertifika alan adları gösterilir. Konum hesaplaması alanın sol üst köşesine göre yapılır.
              </div>
              <div className="layout-editor-grid">
                <div className="field">
                  <label htmlFor={`activeField-${template.id}`}>Aktif Alan</label>
                  <select
                    id={`activeField-${template.id}`}
                    value={activeField}
                    onChange={(event) => setActiveField(event.target.value as (typeof PREVIEW_FIELDS)[number]["key"])}
                  >
                    {PREVIEW_FIELDS.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`layoutX-${template.id}`}>X</label>
                  <input
                    id={`layoutX-${template.id}`}
                    type="number"
                    value={layout[activeField].x}
                    onChange={(event) => updateFieldPosition("x", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`layoutY-${template.id}`}>Y</label>
                  <input
                    id={`layoutY-${template.id}`}
                    type="number"
                    value={layout[activeField].y}
                    onChange={(event) => updateFieldPosition("y", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`layoutSize-${template.id}`}>Font Boyutu</label>
                  <input
                    id={`layoutSize-${template.id}`}
                    type="number"
                    value={layout[activeField].size}
                    onChange={(event) => updateFieldMetric("size", event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`layoutAlign-${template.id}`}>Hizalama</label>
                  <select
                    id={`layoutAlign-${template.id}`}
                    value={layout[activeField].align}
                    onChange={(event) => updateFieldAlign(event.target.value as "left" | "center" | "right")}
                  >
                    <option value="left">Sol</option>
                    <option value="center">Orta</option>
                    <option value="right">Sağ</option>
                  </select>
                </div>
                {activeField === "message" ? (
                  <div className="field">
                    <label htmlFor={`layoutWidth-${template.id}`}>Metin Kutusu Genişliği</label>
                    <input
                      id={`layoutWidth-${template.id}`}
                      type="number"
                      value={layout.message.width}
                      onChange={(event) => updateFieldMetric("width", event.target.value)}
                    />
                  </div>
                ) : null}
                {activeField === "message" ? (
                  <div className="field">
                    <label htmlFor={`layoutLineHeight-${template.id}`}>Satır Yüksekliği</label>
                    <input
                      id={`layoutLineHeight-${template.id}`}
                      type="number"
                      value={layout.message.lineHeight}
                      onChange={(event) => updateFieldMetric("lineHeight", event.target.value)}
                    />
                  </div>
                ) : null}
                <div className="button-row">
                  <button className="button secondary" type="button" onClick={resetLayout}>
                    Varsayılana Dön
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "labels" ? (
            <div className="settings-section-grid">
              <div className="field">
                <label htmlFor={`dateLabel-${template.id}`}>Sertifika Tarihi Etiketi</label>
                <input
                  id={`dateLabel-${template.id}`}
                  value={layout.labels.date.text}
                  onChange={(event) => updateLabel("date", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`dateLabelSize-${template.id}`}>Sertifika Tarihi Etiket Boyutu</label>
                <input
                  id={`dateLabelSize-${template.id}`}
                  type="number"
                  value={layout.labels.date.fontSize}
                  onChange={(event) => updateLabelStyle("date", "fontSize", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`dateLabelBold-${template.id}`}>Sertifika Tarihi Etiket Kalın</label>
                <input
                  id={`dateLabelBold-${template.id}`}
                  type="checkbox"
                  checked={layout.labels.date.bold}
                  onChange={(event) => updateLabelStyle("date", "bold", event.target.checked)}
                />
              </div>

              <div className="field">
                <label htmlFor={`articleIdLabel-${template.id}`}>Makale ID Etiketi</label>
                <input
                  id={`articleIdLabel-${template.id}`}
                  value={layout.labels.articleId.text}
                  onChange={(event) => updateLabel("articleId", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`articleIdLabelSize-${template.id}`}>Makale ID Etiket Boyutu</label>
                <input
                  id={`articleIdLabelSize-${template.id}`}
                  type="number"
                  value={layout.labels.articleId.fontSize}
                  onChange={(event) => updateLabelStyle("articleId", "fontSize", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`articleIdLabelBold-${template.id}`}>Makale ID Etiket Kalın</label>
                <input
                  id={`articleIdLabelBold-${template.id}`}
                  type="checkbox"
                  checked={layout.labels.articleId.bold}
                  onChange={(event) => updateLabelStyle("articleId", "bold", event.target.checked)}
                />
              </div>

              <div className="field">
                <label htmlFor={`evaluationDateLabel-${template.id}`}>Değerlendirme/Yayın Tarihi Etiketi</label>
                <input
                  id={`evaluationDateLabel-${template.id}`}
                  value={layout.labels.evaluationDate.text}
                  onChange={(event) => updateLabel("evaluationDate", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`evaluationDateLabelSize-${template.id}`}>Değerlendirme/Yayın Tarihi Etiket Boyutu</label>
                <input
                  id={`evaluationDateLabelSize-${template.id}`}
                  type="number"
                  value={layout.labels.evaluationDate.fontSize}
                  onChange={(event) => updateLabelStyle("evaluationDate", "fontSize", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`evaluationDateLabelBold-${template.id}`}>Değerlendirme/Yayın Tarihi Etiket Kalın</label>
                <input
                  id={`evaluationDateLabelBold-${template.id}`}
                  type="checkbox"
                  checked={layout.labels.evaluationDate.bold}
                  onChange={(event) => updateLabelStyle("evaluationDate", "bold", event.target.checked)}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "texts" ? (
            <div className="panel-grid">
              <div className="notice">
                Desteklenen değişkenler:
                <span className="mono"> {"{{AD}}, {{SERTIFIKA_BASLIGI}}, {{MAKALE_ADI}}, {{TARIH}}, {{MAKALE_ID}}, {{DEGERLENDIRME_TARIHI}}, {{EPOSTA}}, {{SERTIFIKA_TURU}}"}</span>
              </div>
              <div className="field">
                <label htmlFor={`defaultTitle-${template.id}`}>Sertifika Başlığı Varsayılanı</label>
                <input
                  id={`defaultTitle-${template.id}`}
                  value={layout.defaults.certificateTitle}
                  onChange={(event) => updateDefaultCertificateTitle(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`subject-${template.id}`}>Mail Konusu</label>
                <textarea
                  id={`subject-${template.id}`}
                  value={subjectTemplate}
                  onChange={(event) => setSubjectTemplate(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`body-${template.id}`}>Mail Gövdesi</label>
                <textarea
                  id={`body-${template.id}`}
                  value={bodyTemplate}
                  onChange={(event) => setBodyTemplate(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor={`cert-${template.id}`}>Sertifika Metni</label>
                <textarea
                  id={`cert-${template.id}`}
                  value={certificateTextTemplate}
                  onChange={(event) => setCertificateTextTemplate(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="button-row">
            <button className="button primary" type="submit">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
