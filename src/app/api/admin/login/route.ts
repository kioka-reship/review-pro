import { NextRequest, NextResponse } from "next/server";

// Remove invisible/control characters (keep only printable ASCII 0x20-0x7E)
function cleanString(str: string): string {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0x20 && code <= 0x7E) { result += str[i]; }
  }
  return result.trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.ADMIN_EMAIL;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const validEmails = validEmail
    .split(/[\s,]+/)
    .map(e => cleanString(e))
    .filter(e => e.length > 0);
  const normalizedEmail = cleanString(email || '');
  console.log("ADMIN_EMAIL env:", process.env.ADMIN_EMAIL);
  console.log("Input email (raw):", email);
  console.log("Input email (normalized):", normalizedEmail);
  console.log("validEmails array:", JSON.stringify(validEmails));
  console.log("normalizedEmail:", JSON.stringify(normalizedEmail));
  console.log("includes result:", validEmails.includes(normalizedEmail));
  console.log("validEmails charCodes:", JSON.stringify(validEmails[0]?.split('').map(c => c.charCodeAt(0))));
  console.log("normalizedEmail charCodes:", JSON.stringify(normalizedEmail.split('').map(c => c.charCodeAt(0))));
  console.log("Password match:", password === process.env.ADMIN_PASSWORD);
  if (validEmails.includes(normalizedEmail) && password === validPassword) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_auth", validPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
}
