import { NextResponse } from "next/server";
import { assertAdminApiAccess } from "@/lib/auth";
import { createDraftForRecord } from "@/lib/certificates";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  if (!(await assertAdminApiAccess())) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const { id } = await params;

  try {
    await createDraftForRecord(id);
    return NextResponse.redirect(new URL(`/panel/sertifikalar/${id}`, request.url), { status: 303 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Taslak oluşturulamadı.";
    return NextResponse.redirect(
      new URL(`/panel/sertifikalar?error=${encodeURIComponent(message)}`, request.url),
      { status: 303 },
    );
  }
}
