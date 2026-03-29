import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getCertificateDetail } from "@/lib/certificates";
import { PanelShell } from "@/components/panel-shell";
import { DeleteCertificateForm } from "@/components/delete-certificate-form";
import { resolveLayoutConfig } from "@/lib/certificate-layouts";
import { formatDateTR } from "@/lib/utils";
import { getCertificateTypeLabel } from "@/lib/templates";
import { CertificateVisualPreview } from "@/components/certificate-visual-preview";

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

  const layout = resolveLayoutConfig(detail.type, detail.template.layoutConfigJson);

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
                {detail.pdfPath ? "PDF Yeniden Üret" : "PDF Üret"}
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
            <DeleteCertificateForm action={`/api/certificates/${detail.id}/delete`} />
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
              <dt>Makale Adı</dt>
              <dd>{detail.articleTitle}</dd>
            </div>
            <div className="meta-item">
              <dt>Sertifika Tarihi</dt>
              <dd>{detail.date ? formatDateTR(detail.date) : "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>Sertifika Başlığı</dt>
              <dd>{detail.certificateTitle || "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>Makale ID</dt>
              <dd>{detail.customFields.articleId || "-"}</dd>
            </div>
            <div className="meta-item">
              <dt>{layout.labels.evaluationDate.text}</dt>
              <dd>{detail.customFields.evaluationDate || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="stack">
          <div className="card">
            <h2 className="section-title">Şablon</h2>
            <dl className="meta-list">
              <div className="meta-item">
                <dt>Şablon Adı</dt>
                <dd>{detail.template.displayName}</dd>
              </div>
              <div className="meta-item">
                <dt>Arka Plan</dt>
                <dd className="mono">{detail.template.backgroundPath}</dd>
              </div>
              <div className="meta-item">
                <dt>PDF Boyutu</dt>
                <dd>{detail.pdfFileSize ? `${(detail.pdfFileSize / (1024 * 1024)).toFixed(2)} MB` : "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="card stack">
            <h2 className="section-title">Sertifika Önizleme</h2>
            {detail.pdfPath ? (
              <iframe
                className="certificate-pdf-frame"
                src={`/api/certificates/${detail.id}/file?inline=1`}
                title="Sertifika PDF önizleme"
              />
            ) : (
              <CertificateVisualPreview
                type={detail.type}
                backgroundPath={detail.template.backgroundPath}
                certificateTextTemplate={detail.template.certificateTextTemplate}
                layoutConfigJson={detail.template.layoutConfigJson}
                fullName={detail.fullName}
                email={detail.email}
                articleTitle={detail.articleTitle}
                date={detail.date ? new Date(detail.date) : null}
                certificateTitle={detail.certificateTitle}
                customFields={detail.customFields}
              />
            )}
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
