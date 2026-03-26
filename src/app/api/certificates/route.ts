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
      | "REKTORLUK"
      | "YAZARLIK",
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
      type: String(formData.get("type") ?? "HAKEMLIK") as "HAKEMLIK" | "REKTORLUK" | "YAZARLIK",
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      eventName: String(formData.get("eventName") ?? ""),
      eventDate: String(formData.get("eventDate") ?? ""),
      organizer: String(formData.get("organizer") ?? ""),
      ozel1: String(formData.get("ozel1") ?? ""),
      ozel2: String(formData.get("ozel2") ?? ""),
      ozel3: String(formData.get("ozel3") ?? ""),
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
