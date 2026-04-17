import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (email === validEmail && password === validPassword) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
}
