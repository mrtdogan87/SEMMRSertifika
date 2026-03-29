import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { createCertificateRecord, getCertificateList } from "@/lib/certificates";

export async function GET(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const items = await getCertificateList({
    q: searchParams.get("q") ?? "",
    type: (searchParams.get("type") ?? "ALL") as
      | "ALL"
      | "HAKEMLIK"
      | "EDITORLUK"
      | "YAZARLIK"
      | "DIGER",
    status: (searchParams.get("status") ?? "ALL") as
      | "ALL"
      | "DRAFT"
      | "GENERATED"
      | "DRAFTED_EMAIL"
      | "SENT"
      | "FAILED",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const record = await createCertificateRecord({
      templateId: String(formData.get("templateId") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      articleTitle: String(formData.get("articleTitle") ?? ""),
      date: String(formData.get("date") ?? ""),
      certificateTitle: String(formData.get("certificateTitle") ?? ""),
      articleId: String(formData.get("articleId") ?? ""),
      evaluationDate: String(formData.get("evaluationDate") ?? ""),
    });

    return NextResponse.redirect(new URL(`/panel/sertifikalar/${record.id}`, request.url), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt oluşturulamadı.";
    return NextResponse.redirect(
      new URL(`/panel/sertifikalar/yeni?error=${encodeURIComponent(message)}`, request.url),
      { status: 303 },
    );
  }
}
