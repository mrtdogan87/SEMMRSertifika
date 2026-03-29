import { requireAdmin } from "@/lib/auth";
import { listCertificateTemplates } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { CsvImportForm } from "@/components/csv-import-form";

export default async function ImportPage() {
  await requireAdmin();
  const templates = await listCertificateTemplates();

  return (
    <PanelShell
      title="Excel İçe Aktar"
      description="Şablona göre Excel dosyası indirip doldurun, sonra tekrar yükleyin. Kayıtlar açılır ve PDF’ler otomatik üretilir."
    >
      <section className="card">
        <CsvImportForm
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
