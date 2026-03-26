import { requireAdmin } from "@/lib/auth";
import { listCertificateTemplates } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { CsvImportForm } from "@/components/csv-import-form";

export default async function ImportPage() {
  await requireAdmin();
  const templates = await listCertificateTemplates();

  return (
    <PanelShell
      title="CSV İçe Aktarma"
      description="Manuel listedeki kayıtları CSV metni ile ekleyin. İlk satır başlık olmalıdır."
    >
      <section className="card">
        <CsvImportForm
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
            type: template.type,
          }))}
        />
      </section>
    </PanelShell>
  );
}
