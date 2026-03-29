"use client";

import { useMemo, useState } from "react";
import type { CertificateType } from "@prisma/client";
import { TemplateSettingsForm } from "@/components/template-settings-form";
import { getCertificateTypeOrder, getPresetGuidance } from "@/lib/certificate-presets";

type TemplateOption = {
  id: string;
  type: CertificateType;
  name: string;
  backgroundPath: string;
  subjectTemplate: string;
  bodyTemplate: string;
  certificateTextTemplate: string;
  layoutConfigJson: string;
  typeLabel: string;
};

export function TemplateSettingsPanel({
  templates,
  initialType,
}: {
  templates: TemplateOption[];
  initialType: CertificateType;
}) {
  const availableTypes = useMemo(() => {
    const existing = new Set(templates.map((template) => template.type));
    return getCertificateTypeOrder().filter((type) => existing.has(type));
  }, [templates]);
  const [activeType, setActiveType] = useState<CertificateType>(initialType);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const activeTemplate =
    templates.find((template) => template.type === activeType) ?? templates[0] ?? null;

  function handleTypeChange(nextType: CertificateType) {
    if (nextType === activeType) {
      return;
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Kaydedilmemiş değişiklikler var. Şablon değiştirmek istiyor musunuz?");
      if (!confirmed) {
        return;
      }
    }

    setHasUnsavedChanges(false);
    setActiveType(nextType);
  }

  if (!activeTemplate) {
    return null;
  }

  return (
    <div className="template-panel-shell">
      <div className="template-switcher" role="tablist" aria-label="Şablon seçimi">
        {availableTypes.map((type) => {
          const template = templates.find((item) => item.type === type);
          if (!template) {
            return null;
          }

          return (
            <button
              key={type}
              className={`template-switcher-button ${type === activeType ? "template-switcher-button-active" : ""}`}
              type="button"
              onClick={() => handleTypeChange(type)}
            >
              {template.typeLabel}
            </button>
          );
        })}
      </div>

      <TemplateSettingsForm
        key={activeTemplate.id}
        template={activeTemplate}
        typeLabel={activeTemplate.typeLabel}
        presetGuidance={getPresetGuidance(activeTemplate.type)}
        onDirtyChange={setHasUnsavedChanges}
      />
    </div>
  );
}
