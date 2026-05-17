import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

const validEmails = validEmail.split(",").map(e => e.trim());
if (validEmails.includes(email) && password === validPassword) {
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_auth", validPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8時間
    path: "/",
  });
  return res;
}

  return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
}
