import Link from "next/link";

export function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="toolbar">
          <Link className="button secondary" href="/panel/sertifikalar">
            Sertifikalar
          </Link>
          <Link className="button secondary" href="/panel/sertifikalar/yeni">
            Yeni Kayıt
          </Link>
          <Link className="button secondary" href="/panel/sertifikalar/import">
            Excel İçe Aktar
          </Link>
          <Link className="button secondary" href="/panel/ayarlar">
            Ayarlar
          </Link>
          <form className="inline-form" action="/api/auth/logout" method="POST">
            <button className="button danger" type="submit">
              Çıkış
            </button>
          </form>
        </div>
      </section>
      {children}
    </main>
  );
}
