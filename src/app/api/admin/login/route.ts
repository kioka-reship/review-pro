import { NextRequest, NextResponse } from "next/server";

// Normalize full-width ASCII (U+FF01-FF5E) to half-width, then strip control/invisible chars
function cleanString(str: string): string {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // Full-width ASCII (e.g. full-width @ U+FF20 -> @ U+0040)
    if (code >= 0xFF01 && code <= 0xFF5E) {
      result += String.fromCharCode(code - 0xFEE0);
    }
    // Keep printable ASCII only (0x20-0x7E)
    else if (code >= 0x20 && code <= 0x7E) {
      result += str[i];
    }
    // Discard everything else (control chars, zero-width spaces, BOM, etc.)
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