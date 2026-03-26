import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getCertificateList } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { formatDateTR } from "@/lib/utils";
import { getCertificateTypeLabel } from "@/lib/templates";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    ok?: string;
    error?: string;
  }>;
};

export default async function CertificateListPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const items = await getCertificateList({
    q: params.q,
    type: params.type as "ALL" | "HAKEMLIK" | "REKTORLUK" | "YAZARLIK" | undefined,
    status: params.status as "ALL" | "DRAFT" | "GENERATED" | "DRAFTED_EMAIL" | "SENT" | "FAILED" | undefined,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  return (
    <PanelShell
      title="Sertifikalar"
      description="Manuel oluşturulan ve CSV ile içe aktarılan sertifika kayıtlarını yönetin."
    >
      <section className="card panel-grid">
        {params.ok ? <div className="notice success">{params.ok}</div> : null}
        {params.error ? <div className="notice error">{params.error}</div> : null}

        <form className="filter-grid" method="GET">
          <div className="field">
            <label htmlFor="q">Arama</label>
            <input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Ad, e-posta, etkinlik" />
          </div>
          <div className="field">
            <label htmlFor="type">Tür</label>
            <select id="type" name="type" defaultValue={params.type ?? "ALL"}>
              <option value="ALL">Tümü</option>
              <option value="HAKEMLIK">Hakemlik</option>
              <option value="REKTORLUK">Rektörlük</option>
              <option value="YAZARLIK">Yazarlık</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Durum</label>
            <select id="status" name="status" defaultValue={params.status ?? "ALL"}>
              <option value="ALL">Tümü</option>
              <option value="DRAFT">Taslak</option>
              <option value="GENERATED">Üretildi</option>
              <option value="DRAFTED_EMAIL">Taslak Mail</option>
              <option value="SENT">Gönderildi</option>
              <option value="FAILED">Hatalı</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dateFrom">Başlangıç</label>
            <input id="dateFrom" type="date" name="dateFrom" defaultValue={params.dateFrom ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="dateTo">Bitiş</label>
            <input id="dateTo" type="date" name="dateTo" defaultValue={params.dateTo ?? ""} />
          </div>
          <div className="button-row">
            <button className="button primary" type="submit">
              Filtrele
            </button>
            <Link className="button secondary" href="/panel/sertifikalar">
              Temizle
            </Link>
          </div>
        </form>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Tür</th>
                <th>E-posta</th>
                <th>Etkinlik</th>
                <th>Durum</th>
                <th>PDF</th>
                <th>Oluşturma</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/panel/sertifikalar/${item.id}`}>{item.fullName}</Link>
                  </td>
                  <td>{getCertificateTypeLabel(item.type)}</td>
                  <td>{item.email}</td>
                  <td>{item.eventName}</td>
                  <td>
                    <span className="status-pill">{item.status}</span>
                  </td>
                  <td>{item.pdfFileSize ? `${(item.pdfFileSize / 1024).toFixed(0)} KB` : "-"}</td>
                  <td>{formatDateTR(item.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link className="button secondary" href={`/panel/sertifikalar/${item.id}`}>
                        Detay
                      </Link>
                      <form className="inline-form" action={`/api/certificates/${item.id}/generate`} method="POST">
                        <button className="button secondary" type="submit">
                          Üret
                        </button>
                      </form>
                      <form className="inline-form" action={`/api/certificates/${item.id}/email-draft`} method="POST">
                        <button className="button secondary" type="submit">
                          Taslak
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PanelShell>
  );
}
