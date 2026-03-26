import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { updateTemplateSettings } from "@/lib/certificates";

export async function POST(request: Request) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  try {
    const formData = await request.formData();
    await updateTemplateSettings({
      id: String(formData.get("id") ?? ""),
      name: String(formData.get("name") ?? ""),
      subjectTemplate: String(formData.get("subjectTemplate") ?? ""),
      bodyTemplate: String(formData.get("bodyTemplate") ?? ""),
      certificateTextTemplate: String(formData.get("certificateTextTemplate") ?? ""),
    });

    return NextResponse.redirect(
      new URL("/panel/ayarlar?ok=%C5%9Eablon%20kaydedildi.", request.url),
      { status: 303 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Şablon kaydedilemedi.";
    return NextResponse.redirect(
      new URL(`/panel/ayarlar?error=${encodeURIComponent(message)}`, request.url),
      { status: 303 },
    );
  }
}
