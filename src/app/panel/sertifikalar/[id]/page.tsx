import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCertificateDetail } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { formatDateTR } from "@/lib/utils";
import { getCertificateTypeLabel } from "@/lib/templates";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CertificateDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getCertificateDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <PanelShell
      title="Sertifika Detayı"
      description="Kayıt, üretilen PDF ve e-posta geçmişini bu ekrandan yönetin."
    >
      <div className="detail-grid">
        <section className="card stack">
          <div className="button-row">
            <Link className="button secondary" href="/panel/sertifikalar">
              Listeye Dön
            </Link>
            {detail.pdfPath ? (
              <a className="button secondary" href={`/api/certificates/${detail.id}/file`}>
                PDF İndir
              </a>
            ) : null}
            <form className="inline-form" action={`/api/certificates/${detail.id}/generate`} method="POST">
              <button className="button primary" type="submit">
                PDF Üret
              </button>
            </form>
            <form className="inline-form" action={`/api/certificates/${detail.id}/email-draft`} method="POST">
              <button className="button secondary" type="submit">
                Taslak Oluştur
              </button>
            </form>
            <form className="inline-form" action={`/api/certificates/${detail.id}/send`} method="POST">
              <button className="button secondary" type="submit">
                Gönder
              </button>
            </form>
          </div>

          {detail.lastError ? (
            <div className={detail.lastError.startsWith("PDF boyutu") ? "notice" : "notice error"}>
              {detail.lastError}
            </div>
          ) : null}

          <h2 className="section-title">Kayıt Bilgileri</h2>
          <dl className="meta-list">
            <div className="meta-item">
              <dt>Ad Soyad</dt>
              <dd>{detail.fullName}</dd>
            </div>
            <div className="meta-item">
              <dt>Tür</dt>
              <dd>{getCertificateTypeLabel(detail.type)}</dd>
            </div>
            <div className="meta-item">
              <dt>E-posta</dt>
              <dd>{detail.email}</dd>
            </div>
            <div className="meta-item">
              <dt>Etkinlik</dt>
              <dd>{detail.eventName}</dd>
            </div>
            <div className="meta-item">
              <dt>Tarih</dt>
              <dd>{detail.eventDate ? formatDateTR(detail.eventDate) : "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>Düzenleyici</dt>
              <dd>{detail.organizer || "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>Özel Alan 1</dt>
              <dd>{detail.customFields.ozel1 || "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>Özel Alan 2</dt>
              <dd>{detail.customFields.ozel2 || "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>Özel Alan 3</dt>
              <dd>{detail.customFields.ozel3 || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="stack">
          <div className="card">
            <h2 className="section-title">Şablon</h2>
            <dl className="meta-list">
              <div className="meta-item">
                <dt>Şablon Adı</dt>
                <dd>{detail.template.name}</dd>
              </div>
              <div className="meta-item">
                <dt>Arka Plan</dt>
                <dd className="mono">{detail.template.backgroundPath}</dd>
              </div>
              <div className="meta-item">
                <dt>PDF Boyutu</dt>
                <dd>{detail.pdfFileSize ? `${(detail.pdfFileSize / 1024).toFixed(0)} KB` : "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="section-title">Mail Geçmişi</h2>
            {detail.emailLogs.length ? (
              <div className="stack">
                {detail.emailLogs.map((log) => (
                  <div key={log.id} className="notice">
                    <strong>{log.actionType}</strong> · {log.status} · {formatDateTR(log.createdAt)}
                    <div>{log.recipient}</div>
                    <div>{log.subject}</div>
                    {log.errorMessage ? <div className="notice error">{log.errorMessage}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice">Henüz mail kaydı yok.</div>
            )}
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
