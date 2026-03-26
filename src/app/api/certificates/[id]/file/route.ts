import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readCertificatePdf } from "@/lib/storage";
import { sanitizeFileName } from "@/lib/utils";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const record = await prisma.certificateRecord.findUnique({
    where: { id },
  });

  if (!record?.pdfPath) {
    return NextResponse.json({ error: "PDF bulunamadı." }, { status: 404 });
  }

  const bytes = await readCertificatePdf(record.pdfPath);

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${sanitizeFileName(record.fullName) || record.id}.pdf"`,
    },
  });
}
