import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { password?: string };
  if (body.password !== adminPassword) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
