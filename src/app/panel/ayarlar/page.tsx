import { requireAdmin } from "@/lib/auth";
import { listCertificateTemplates } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { getCertificateTypeLabel } from "@/lib/templates";
import { TemplateSettingsPanel } from "@/components/template-settings-panel";
import { isCertificateType } from "@/lib/certificate-presets";

type PageProps = {
  searchParams: Promise<{ ok?: string; error?: string; type?: string }>;
};

export default async function SettingsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const templates = await listCertificateTemplates();
  const params = await searchParams;
  const fallbackType = templates[0]?.type;
  const initialType =
    params.type && isCertificateType(params.type) ? params.type : fallbackType;

  return (
    <PanelShell
      title="Şablon Ayarları"
      description="Hazır presetleri ve özel şablonları tek ekrandan sade biçimde yönetin."
    >
      <section className="panel-grid">
        {params.ok ? <div className="notice success">{params.ok}</div> : null}
        {params.error ? <div className="notice error">{params.error}</div> : null}
        {initialType ? (
          <TemplateSettingsPanel
            templates={templates.map((template) => ({
              ...template,
              typeLabel: getCertificateTypeLabel(template.type),
            }))}
            initialType={initialType}
          />
        ) : (
          <div className="notice error">Şablon bulunamadı.</div>
        )}
      </section>
    </PanelShell>
  );
}
