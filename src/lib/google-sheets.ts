import { google } from "googleapis";

const SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const TAB_NAME = process.env.GOOGLE_SHEETS_TAB_NAME || "Sheet1";

const PLAN_LABELS: Record<string, string> = {
  light:    "ライト ¥4,980/月",
  standard: "スタンダード ¥9,800/月",
  premium:  "プレミアム ¥19,800/月",
};

const HEADERS = [
  "契約日", "店舗ID", "店舗名", "代表者名", "メールアドレス",
  "電話番号", "プラン", "契約種別", "月額", "初期費用",
  "決済ステータス", "Square顧客ID", "Square決済ID", "紹介コード",
  "営業マン名", "販路名", "報酬対象", "作成日",
];

export type SheetStoreInput = {
  id: string;
  name: string;
  company_name?: string | null;
  owner_name?: string | null;
  email: string;
  plan: string;
  billing_cycle?: string | null;
  monthly_price?: number | null;
  setup_fee_paid_amount?: number | null;
  status?: string | null;
  square_customer_id?: string | null;
  referral_code?: string | null;
  sales_person_name?: string | null;
  sales_channel?: string | null;
  created_at: string;
  setup_fee_paid_at?: string | null;
  // extras passed at call time
  square_payment_id?: string | null;
  commission_enabled?: boolean | null;
  commission_rate?: number | null;
};

export async function appendStoreToSheet(store: SheetStoreInput): Promise<void> {
  if (!SHEETS_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error("Google Sheets env vars not configured (GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY)");
  }

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const toJST = (iso: string | null | undefined) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // 18 columns matching the spec
  const row = [
    toJST(store.setup_fee_paid_at || store.created_at),  // 契約日
    store.id,                                              // 店舗ID
    store.name,                                            // 店舗名
    store.owner_name || "",                                // 代表者名
    store.email,                                           // メールアドレス
    "",                                                    // 電話番号 (stores テーブルに列なし)
    PLAN_LABELS[store.plan] || store.plan,                 // プラン
    store.billing_cycle === "yearly" ? "年契約" : "月契約", // 契約種別
    store.monthly_price ?? "",                             // 月額
    store.setup_fee_paid_amount ?? "",                     // 初期費用
    store.status || "",                                    // 決済ステータス
    store.square_customer_id || "",                        // Square顧客ID
    store.square_payment_id || "",                         // Square決済ID
    store.referral_code || "",                             // 紹介コード
    store.sales_person_name || "",                         // 営業マン名
    store.sales_channel || "",                             // 販路名
    store.commission_enabled
      ? (store.commission_rate != null ? `◯ ${store.commission_rate}%` : "◯")
      : "",                                                 // 報酬対象
    toJST(store.created_at),                               // 作成日
  ];

  // Ensure header exists in row 1
  const check = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEETS_ID,
    range: `${TAB_NAME}!A1`,
  });
  const firstCell = check.data.values?.[0]?.[0];
  if (!firstCell) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEETS_ID,
      range: `${TAB_NAME}!A1:R1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [HEADERS] },
    });
  }

  // Append data starting from row 2
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEETS_ID,
    range: `${TAB_NAME}!A:R`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}
