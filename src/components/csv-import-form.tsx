"use client";

import { useMemo, useState } from "react";

type TemplateOption = {
  id: string;
  type: string;
  name: string;
};

export function CsvImportForm({ templates }: { templates: TemplateOption[] }) {
  const [csvText, setCsvText] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [type, setType] = useState(templates[0]?.type ?? "HAKEMLIK");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const previewRows = useMemo(() => csvText.trim().split(/\r?\n/).slice(0, 6), [csvText]);

  async function handleSubmit() {
    setBusy(true);
    setMessage(null);

    const response = await fetch("/api/certificates/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText, templateId, type }),
    });

    const result = (await response.json().catch(() => null)) as { error?: string; ok?: string } | null;
    setBusy(false);

    if (!response.ok) {
      setMessage(result?.error ?? "CSV içe aktarma başarısız oldu.");
      return;
    }

    setCsvText("");
    setMessage(result?.ok ?? "CSV kayıtları oluşturuldu.");
  }

  return (
    <div className="panel-grid">
      <div className="form-grid">
        <div className="field">
          <label htmlFor="templateId">Şablon</label>
          <select
            id="templateId"
            value={templateId}
            onChange={(event) => {
              const selected = templates.find((item) => item.id === event.target.value);
              setTemplateId(event.target.value);
              setType(selected?.type ?? type);
            }}
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="type">Tür</label>
          <select id="type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="HAKEMLIK">Hakemlik</option>
            <option value="REKTORLUK">Rektörlük</option>
            <option value="YAZARLIK">Yazarlık</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="csvText">CSV İçeriği</label>
        <textarea
          id="csvText"
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder={"Ad Soyad,E-posta,Etkinlik,Tarih,Düzenleyici\nAli Veli,ali@example.com,Panel,26.03.2026,SEMMR"}
        />
      </div>

      {previewRows.length ? (
        <div className="notice">
          <strong>Önizleme</strong>
          <div className="mono">{previewRows.join("\n")}</div>
        </div>
      ) : null}

      {message ? <div className="notice">{message}</div> : null}

      <div className="button-row">
        <button className="button primary" type="button" onClick={handleSubmit} disabled={busy}>
          {busy ? "İçe aktarılıyor..." : "CSV Kayıtlarını Oluştur"}
        </button>
      </div>
    </div>
  );
}
