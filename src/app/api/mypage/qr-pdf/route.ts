import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = "https://review-pro-ay7x.vercel.app";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");

  if (!storeId) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("id", storeId)
    .single();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const reviewUrl = `${APP_URL}/review/${store.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reviewUrl)}`;

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>口コミ投稿QRコード - ${store.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Noto Sans JP', sans-serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      width: 210mm;
      max-width: 600px;
      background: linear-gradient(160deg, #0F1923, #1a3a2a);
      border-radius: 24px;
      padding: 48px 40px;
      text-align: center;
      color: #fff;
    }
    .logo {
      font-size: 14px;
      color: #7a9ab5;
      letter-spacing: 3px;
      margin-bottom: 32px;
      font-weight: 700;
    }
    .store-name {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #7a9ab5;
      margin-bottom: 40px;
    }
    .qr-wrap {
      background: #fff;
      border-radius: 20px;
      padding: 24px;
      display: inline-block;
      margin-bottom: 32px;
    }
    .qr-wrap img {
      width: 240px;
      height: 240px;
      display: block;
    }
    .message {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .description {
      font-size: 14px;
      color: #7a9ab5;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    .steps {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 32px;
    }
    .step {
      text-align: center;
    }
    .step-num {
      width: 36px;
      height: 36px;
      background: #2C7A4B;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      margin: 0 auto 8px;
    }
    .step-text {
      font-size: 12px;
      color: #7a9ab5;
    }
    .url {
      font-size: 11px;
      color: #4a6a7a;
      word-break: break-all;
    }
    @media print {
      body { padding: 0; }
      .card { border-radius: 0; width: 100%; max-width: 100%; }
    }
  </style>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="card">
    <div class="logo">REVIEW PRO</div>
    <div class="store-name">${store.name}</div>
    <div class="subtitle">口コミ投稿のお願い</div>
    <div class="qr-wrap">
      <img src="${qrUrl}" alt="QRコード" />
    </div>
    <div class="message">
      ご来店ありがとうございました！<br>
      ぜひ口コミを投稿してください 🙏
    </div>
    <div class="description">
      QRコードを読み取るだけで<br>
      AIが口コミ文を自動で作成します
    </div>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <div class="step-text">QRを<br>読み取る</div>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <div class="step-text">質問に<br>答える</div>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <div class="step-text">口コミを<br>投稿する</div>
      </div>
    </div>
    <div class="url">${reviewUrl}</div>
  </div>
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
