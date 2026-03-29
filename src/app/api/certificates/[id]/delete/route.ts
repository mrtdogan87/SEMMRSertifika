import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { deleteCertificateRecord } from "@/lib/certificates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  try {
    const { id } = await context.params;
    await deleteCertificateRecord(id);

    return NextResponse.redirect(
      new URL("/panel/sertifikalar?ok=Sertifika%20kaydi%20silindi.", request.url),
      { status: 303 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sertifika kaydı silinemedi.";
    return NextResponse.redirect(
      new URL(`/panel/sertifikalar?error=${encodeURIComponent(message)}`, request.url),
      { status: 303 },
    );
  }
}
