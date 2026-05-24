import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

const validEmails = validEmail
  .split(/[\s,]+/)
  .map(e => e.trim().toLowerCase())
  .filter(e => e.length > 0);
const normalizedEmail = (email || "").trim().toLowerCase();
console.log("ADMIN_EMAIL env:", process.env.ADMIN_EMAIL);
console.log("Input email (raw):", email);
console.log("Input email (normalized):", normalizedEmail);
console.log("validEmails array:", JSON.stringify(validEmails));
console.log("normalizedEmail:", JSON.stringify(normalizedEmail));
console.log("includes result:", validEmails.includes(normalizedEmail));
console.log("Password match:", password === process.env.ADMIN_PASSWORD);
if (validEmails.includes(normalizedEmail) && password === validPassword) {
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
