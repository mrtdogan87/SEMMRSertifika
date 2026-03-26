import { requireAdmin } from "@/lib/auth";
import { listCertificateTemplates } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { getCertificateTypeLabel } from "@/lib/templates";

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
        <form className="form-grid" action="/api/certificates" method="POST">
          <div className="field">
            <label htmlFor="templateId">Şablon</label>
            <select id="templateId" name="templateId" required>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({getCertificateTypeLabel(template.type)})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="type">Tür</label>
            <select id="type" name="type" required>
              <option value="HAKEMLIK">Hakemlik</option>
              <option value="REKTORLUK">Rektörlük</option>
              <option value="YAZARLIK">Yazarlık</option>
            </select>
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
            <label htmlFor="eventName">Etkinlik</label>
            <input id="eventName" name="eventName" required />
          </div>
          <div className="field">
            <label htmlFor="eventDate">Tarih</label>
            <input id="eventDate" name="eventDate" placeholder="26.03.2026" />
          </div>
          <div className="field">
            <label htmlFor="organizer">Düzenleyici</label>
            <input id="organizer" name="organizer" />
          </div>
          <div className="field">
            <label htmlFor="ozel1">Özel Alan 1</label>
            <input id="ozel1" name="ozel1" />
          </div>
          <div className="field">
            <label htmlFor="ozel2">Özel Alan 2</label>
            <input id="ozel2" name="ozel2" />
          </div>
          <div className="field">
            <label htmlFor="ozel3">Özel Alan 3</label>
            <input id="ozel3" name="ozel3" />
          </div>
          <div className="button-row">
            <button className="button primary" type="submit">
              Kaydı Oluştur
            </button>
          </div>
        </form>
      </section>
    </PanelShell>
  );
}
