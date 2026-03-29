import { requireAdmin } from "@/lib/auth";
import { listCertificateTemplates } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { NewCertificateForm } from "@/components/new-certificate-form";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCertificatePage({ searchParams }: PageProps) {
  await requireAdmin();
  const templates = await listCertificateTemplates();
  const params = await searchParams;

  return (
    <PanelShell
      title="Yeni Sertifika Kaydı"
      description="Tekil sertifika alıcısı ekleyin ve sonrasında PDF üretimi veya taslak mail işlemlerini yönetin."
    >
      <section className="card panel-grid">
        {params.error ? <div className="notice error">{params.error}</div> : null}
        <div className="notice">
          <strong>Şablon Değişkenleri</strong>
          <div className="mono">{`{{AD}} {{SERTIFIKA_BASLIGI}} {{MAKALE_ADI}} {{TARIH}} {{MAKALE_ID}} {{DEGERLENDIRME_TARIHI}} {{EPOSTA}} {{SERTIFIKA_TURU}}`}</div>
        </div>
        <NewCertificateForm
          templates={templates.map((template) => ({
            id: template.id,
            type: template.type,
            layoutConfigJson: template.layoutConfigJson,
          }))}
        />
      </section>
    </PanelShell>
  );
}
