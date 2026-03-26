import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  if (await getCurrentAdmin()) {
    redirect("/panel/sertifikalar");
  }

  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="card login-card">
        <div className="hero" style={{ display: "block", marginBottom: 24 }}>
          <h1>Sertifika Yönetim Paneli</h1>
          <p>
            Bu alan bağımsız sertifika üretim sistemi içindir. OJR’den bağımsız çalışır ve yalnızca
            yönetim erişimine açıktır.
          </p>
        </div>
        {params.error ? <div className="notice error">Giriş bilgileri hatalı.</div> : null}
        <LoginForm />
      </section>
    </main>
  );
}
