import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { createCertificateRecord, generateCertificateForRecord, listCertificateTemplates } from "@/lib/certificates";
import { getCertificateTypeSlug } from "@/lib/certificate-presets";
import { parseCertificateCsv } from "@/lib/csv";
import { parseCertificateSpreadsheet, buildTemplateWorkbook } from "@/lib/spreadsheet";

export async function GET(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const templateId = String(searchParams.get("templateId") ?? "");

  if (!templateId) {
    return NextResponse.json({ error: "Şablon seçilmedi." }, { status: 400 });
  }

  const templates = await listCertificateTemplates();
  const template = templates.find((item) => item.id === templateId);

  if (!template) {
    return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
  }

  const bytes = buildTemplateWorkbook(template.type);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=\"sertifika-sablon-${getCertificateTypeSlug(template.type)}.xlsx\"`,
    },
  });
}

export async function POST(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let rows;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const templateId = String(formData.get("templateId") ?? "");
      const file = formData.get("file");

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "Lütfen bir Excel dosyası seçin." }, { status: 400 });
      }

      const templates = await listCertificateTemplates();
      const template = templates.find((item) => item.id === templateId);
      if (!template) {
        return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      rows = parseCertificateSpreadsheet(bytes, templateId);
    } else {
      const body = (await request.json()) as {
        csvText?: string;
        templateId?: string;
      };
      const templates = await listCertificateTemplates();
      const template = templates.find((item) => item.id === (body.templateId ?? ""));

      if (!template) {
        return NextResponse.json({ error: "Şablon bulunamadı." }, { status: 404 });
      }

      rows = parseCertificateCsv(body.csvText ?? "", template.id);
    }

    if (!rows.length) {
      return NextResponse.json({ error: "İşlenecek geçerli satır bulunamadı." }, { status: 400 });
    }

    let createdCount = 0;
    let generatedCount = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        const record = await createCertificateRecord(row);
        createdCount += 1;
        try {
          await generateCertificateForRecord(record.id);
          generatedCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : "PDF üretilemedi.";
          errors.push(`Satır ${index + 2}: Kayıt açıldı ama PDF üretilemedi. ${message}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Satır işlenemedi.";
        errors.push(`Satır ${index + 2}: ${message}`);
      }
    }

    if (!createdCount) {
      return NextResponse.json(
        { error: errors.join(" | ") || "Hiç kayıt oluşturulamadı." },
        { status: 400 },
      );
    }

    if (errors.length) {
      return NextResponse.json({
        ok: `${createdCount} kayıt oluşturuldu, ${generatedCount} PDF üretildi.`,
        warning: `${errors.length} satır atlandı.`,
        details: errors,
      });
    }

    return NextResponse.json({ ok: `${createdCount} kayıt oluşturuldu, ${generatedCount} PDF üretildi.` });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Excel içe aktarma başarısız oldu." },
      { status: 400 },
    );
  }
}
