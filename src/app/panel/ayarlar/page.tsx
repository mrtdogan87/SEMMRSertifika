import { requireAdmin } from "@/lib/auth";
import { listCertificateTemplates } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { getCertificateTypeLabel } from "@/lib/templates";

type PageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const templates = await listCertificateTemplates();
  const params = await searchParams;

  return (
    <PanelShell
      title="Şablon Ayarları"
      description="Metin şablonlarını yönetin. Arka plan dosya yolu burada görünür ama panelden değiştirilmez."
    >
      <section className="template-grid">
        {params.ok ? <div className="notice success">{params.ok}</div> : null}
        {params.error ? <div className="notice error">{params.error}</div> : null}
        {templates.map((template) => (
          <form key={template.id} className="card panel-grid" action="/api/templates" method="POST">
            <input type="hidden" name="id" value={template.id} />
            <h2 className="section-title">
              {template.name} ({getCertificateTypeLabel(template.type)})
            </h2>
            <div className="notice">
              Arka plan dosyası: <span className="mono">{template.backgroundPath}</span>
            </div>
            <div className="field">
              <label htmlFor={`name-${template.id}`}>Görünen Ad</label>
              <input id={`name-${template.id}`} name="name" defaultValue={template.name} />
            </div>
            <div className="field">
              <label htmlFor={`subject-${template.id}`}>Konu Şablonu</label>
              <textarea id={`subject-${template.id}`} name="subjectTemplate" defaultValue={template.subjectTemplate} />
            </div>
            <div className="field">
              <label htmlFor={`body-${template.id}`}>Mail Gövdesi</label>
              <textarea id={`body-${template.id}`} name="bodyTemplate" defaultValue={template.bodyTemplate} />
            </div>
            <div className="field">
              <label htmlFor={`cert-${template.id}`}>Sertifika Metni</label>
              <textarea
                id={`cert-${template.id}`}
                name="certificateTextTemplate"
                defaultValue={template.certificateTextTemplate}
              />
            </div>
            <div className="button-row">
              <button className="button primary" type="submit">
                Kaydet
              </button>
            </div>
          </form>
        ))}
      </section>
    </PanelShell>
  );
}
