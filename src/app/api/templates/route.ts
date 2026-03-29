import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { updateTemplateSettings } from "@/lib/certificates";
import { prisma } from "@/lib/prisma";
import { saveTemplateBackground } from "@/lib/storage";

export async function POST(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  let returnType = "";

  try {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "");
    returnType = String(formData.get("returnType") ?? "");
    let backgroundPath: string | undefined;
    const uploaded = formData.get("backgroundFile");

    if (uploaded instanceof File && uploaded.size > 0) {
      const template = await prisma.certificateTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new Error("Şablon bulunamadı.");
      }

      const bytes = Buffer.from(await uploaded.arrayBuffer());
      backgroundPath = await saveTemplateBackground({
        type: template.type,
        fileName: uploaded.name,
        bytes,
      });
    }

    await updateTemplateSettings({
      id,
      subjectTemplate: String(formData.get("subjectTemplate") ?? ""),
      bodyTemplate: String(formData.get("bodyTemplate") ?? ""),
      certificateTextTemplate: String(formData.get("certificateTextTemplate") ?? ""),
      layoutConfigJson: String(formData.get("layoutConfigJson") ?? ""),
      backgroundPath,
    });

    return NextResponse.redirect(
      new URL(
        `/panel/ayarlar?ok=${encodeURIComponent("Şablon kaydedildi.")}${returnType ? `&type=${encodeURIComponent(returnType)}` : ""}`,
        request.url,
      ),
      { status: 303 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şablon kaydedilemedi.";
    return NextResponse.redirect(
      new URL(
        `/panel/ayarlar?error=${encodeURIComponent(message)}${returnType ? `&type=${encodeURIComponent(returnType)}` : ""}`,
        request.url,
      ),
      { status: 303 },
    );
  }
}
