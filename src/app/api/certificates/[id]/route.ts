import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { getCertificateDetail } from "@/lib/certificates";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const detail = await getCertificateDetail(id);

  if (!detail) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  return NextResponse.json(detail);
}
