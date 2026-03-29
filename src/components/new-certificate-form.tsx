"use client";

import { useEffect, useMemo, useState } from "react";
import type { CertificateType } from "@prisma/client";
import { resolveLayoutConfig } from "@/lib/certificate-layouts";
import { getCertificateTypeLabel, getPresetGuidance } from "@/lib/certificate-presets";

type TemplateOption = {
  id: string;
  type: CertificateType;
  layoutConfigJson: string;
};

export function NewCertificateForm({ templates }: { templates: TemplateOption[] }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [certificateTitle, setCertificateTitle] = useState(() => {
    const initialTemplate = templates[0];
    if (!initialTemplate) {
      return "";
    }

    return resolveLayoutConfig(initialTemplate.type, initialTemplate.layoutConfigJson).defaults.certificateTitle;
  });

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0] ?? null,
    [templateId, templates],
  );

  const activeLayout = useMemo(
    () =>
      activeTemplate
        ? resolveLayoutConfig(activeTemplate.type, activeTemplate.layoutConfigJson)
        : null,
    [activeTemplate],
  );

  useEffect(() => {
    if (!activeLayout) {
      return;
    }

    setCertificateTitle(activeLayout.defaults.certificateTitle);
  }, [activeLayout, templateId]);

  if (!activeTemplate || !activeLayout) {
    return null;
  }

  return (
    <form className="form-grid" action="/api/certificates" method="POST">
      <div className="field">
        <label htmlFor="templateId">Şablon</label>
          <select id="templateId" name="templateId" value={templateId} onChange={(event) => setTemplateId(event.target.value)} required>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {getCertificateTypeLabel(template.type)}
              </option>
            ))}
          </select>
      </div>
      <div className="field">
        <label htmlFor="templateType">Şablon Türü</label>
        <input id="templateType" value={getCertificateTypeLabel(activeTemplate.type)} readOnly />
      </div>
      <div className="field full">
        <div className="notice">{getPresetGuidance(activeTemplate.type)}</div>
      </div>
      <div className="field">
        <label htmlFor="fullName">Ad Soyad</label>
        <input id="fullName" name="fullName" required />
      </div>
      <div className="field">
        <label htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div className="field full">
        <label htmlFor="articleTitle">Makale Adı</label>
        <input id="articleTitle" name="articleTitle" required />
      </div>
      <div className="field">
        <label htmlFor="date">Sertifika Tarihi</label>
        <input id="date" name="date" placeholder="26.03.2026" />
      </div>
      <div className="field">
        <label htmlFor="certificateTitle">Sertifika Başlığı</label>
        <input
          id="certificateTitle"
          name="certificateTitle"
          value={certificateTitle}
          required={activeTemplate.type === "DIGER"}
          onChange={(event) => setCertificateTitle(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="articleId">Makale ID</label>
        <input id="articleId" name="articleId" />
      </div>
      <div className="field">
        <label htmlFor="evaluationDate">{activeLayout.labels.evaluationDate.text}</label>
        <input id="evaluationDate" name="evaluationDate" placeholder="27.03.2026" />
      </div>
      <div className="button-row">
        <button className="button primary" type="submit">
          Kaydı Oluştur
        </button>
      </div>
    </form>
  );
}
