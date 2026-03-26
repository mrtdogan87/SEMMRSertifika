import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { bulkCreateCertificateRecords } from "@/lib/certificates";
import { parseCertificateCsv } from "@/lib/csv";

export async function POST(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      csvText?: string;
      templateId?: string;
      type?: "HAKEMLIK" | "REKTORLUK" | "YAZARLIK";
    };

    const rows = parseCertificateCsv(body.csvText ?? "", body.templateId ?? "", body.type ?? "HAKEMLIK");
    if (!rows.length) {
      return NextResponse.json({ error: "İşlenecek geçerli satır bulunamadı." }, { status: 400 });
    }

    await bulkCreateCertificateRecords(rows);
    return NextResponse.json({ ok: `${rows.length} kayıt oluşturuldu.` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CSV içe aktarma başarısız oldu." },
      { status: 400 },
    );
  }
}
