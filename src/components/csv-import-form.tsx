"use client";

import { useMemo, useState } from "react";
import type { CertificateType } from "@prisma/client";
import { resolveLayoutConfig } from "@/lib/certificate-layouts";
import { getCertificateTypeLabel, getPresetGuidance, isCustomTemplateType } from "@/lib/certificate-presets";

type TemplateOption = {
  id: string;
  type: CertificateType;
  layoutConfigJson: string;
};

export function CsvImportForm({ templates }: { templates: TemplateOption[] }) {
  const [csvText, setCsvText] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [detailLines, setDetailLines] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const previewRows = useMemo(() => csvText.trim().split(/\r?\n/).slice(0, 6), [csvText]);
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
  const csvTitlePlaceholder =
    isCustomTemplateType(activeTemplate?.type ?? "HAKEMLIK")
      ? activeLayout?.defaults.certificateTitle || "ÖZEL SERTİFİKA"
      : "";

  async function handleSubmit() {
    setBusy(true);
    setMessage(null);
    setDetailLines([]);

    const response = await fetch("/api/certificates/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText, templateId }),
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string; ok?: string; warning?: string; details?: string[] }
      | null;
    setBusy(false);

    if (!response.ok) {
      setMessage(result?.error ?? "CSV içe aktarma başarısız oldu.");
      setDetailLines(result?.details ?? []);
      return;
    }

    setCsvText("");
    setMessage([result?.ok ?? "CSV kayıtları oluşturuldu.", result?.warning].filter(Boolean).join(" "));
    setDetailLines(result?.details ?? []);
  }

  async function handleExcelUpload() {
    if (!file) {
      setMessage("Lütfen bir Excel dosyası seçin.");
      return;
    }

    setUploadBusy(true);
    setMessage(null);
    setDetailLines([]);

    const formData = new FormData();
    formData.set("templateId", templateId);
    formData.set("file", file);

    const response = await fetch("/api/certificates/import", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json().catch(() => null)) as
      | { error?: string; ok?: string; warning?: string; details?: string[] }
      | null;

    setUploadBusy(false);

    if (!response.ok) {
      setMessage(result?.error ?? "Excel içe aktarma başarısız oldu.");
      setDetailLines(result?.details ?? []);
      return;
    }

    setFile(null);
    setMessage([result?.ok ?? "Excel kayıtları oluşturuldu.", result?.warning].filter(Boolean).join(" "));
    setDetailLines(result?.details ?? []);
  }

  if (!activeTemplate || !activeLayout) {
    return null;
  }

  return (
    <div className="panel-grid">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="templateId">Şablon</label>
          <select id="templateId" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
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
      </div>

      <div className="notice">
        <strong>Seçili Şablon Mantığı</strong>
        <div>{getPresetGuidance(activeTemplate.type)}</div>
        <div>
          Varsayılan sertifika başlığı:
          <span className="mono"> {activeLayout.defaults.certificateTitle || "-"}</span>
        </div>
      </div>

      <div className="notice">
        <strong>Excel Şablon Akışı</strong>
        <div>1. Şablon seçin</div>
        <div>2. Excel şablonunu indirin</div>
        <div>3. Gerekli alanları doldurun</div>
        <div>4. Dosyayı tekrar yükleyin</div>
        <div>5. Kayıtlar açılır ve PDF’ler otomatik üretilir</div>
      </div>

      <div className="notice">
        <strong>Beklenen Kolonlar</strong>
        <div className="mono">
          Ad Soyad, E-posta, Makale Adı, Sertifika Tarihi, Sertifika Başlığı, Makale ID, {activeLayout.labels.evaluationDate.text}
        </div>
        <div>
          <span className="mono">Sertifika Başlığı</span>{" "}
          {isCustomTemplateType(activeTemplate.type)
            ? "Diğer şablonunda boş bırakılmamalıdır."
            : "hazır presetlerde boş bırakılabilir; şablon varsayılanı kullanılır."}
        </div>
      </div>

      <div className="button-row">
        <a className="button secondary" href={`/api/certificates/import?templateId=${templateId}`}>
          Excel Şablonunu İndir
        </a>
      </div>

      <div className="field">
        <label htmlFor="xlsxFile">Doldurulmuş Excel Dosyası</label>
        <input
          id="xlsxFile"
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>

      <div className="button-row">
        <button className="button primary" type="button" onClick={handleExcelUpload} disabled={uploadBusy}>
          {uploadBusy ? "Excel yükleniyor..." : "Excel Yükle ve Sertifikaları Üret"}
        </button>
      </div>

      <div className="field">
        <label htmlFor="csvText">CSV İçeriği (Opsiyonel Yedek)</label>
        <textarea
          id="csvText"
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder={`Ad Soyad,E-posta,Makale Adı,Sertifika Tarihi,Sertifika Başlığı,Makale ID,${activeLayout.labels.evaluationDate.text}\nAli Veli,ali@example.com,Örnek Makale,26.03.2026,${csvTitlePlaceholder},SEMMR-2026-01,27.03.2026`}
        />
      </div>

      {previewRows.length ? (
        <div className="notice">
          <strong>Önizleme</strong>
          <div className="mono">{previewRows.join("\n")}</div>
        </div>
      ) : null}

      {message ? <div className="notice">{message}</div> : null}
      {detailLines.length ? (
        <div className="notice error">
          <strong>Atlanan Satırlar</strong>
          <div className="mono">{detailLines.join("\n")}</div>
        </div>
      ) : null}

      <div className="button-row">
        <button className="button primary" type="button" onClick={handleSubmit} disabled={busy}>
          {busy ? "CSV içe aktarılıyor..." : "CSV ile Kayıtları Oluştur"}
        </button>
      </div>
    </div>
  );
}
