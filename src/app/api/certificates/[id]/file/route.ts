import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readCertificatePdf } from "@/lib/storage";
import { sanitizeFileName } from "@/lib/utils";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteProps) {
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
  const { searchParams } = new URL(request.url);
  const disposition = searchParams.get("inline") === "1" ? "inline" : "attachment";
  const safeName = sanitizeFileName(record.fullName) || record.id;

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeName}.pdf"`,
    },
  });
}
