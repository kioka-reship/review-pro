-- =============================
-- Review Pro データベース設計
-- Supabaseのエディタにそのまま貼り付けて実行してください
-- =============================

-- 店舗テーブル
create table stores (
  id                       text primary key default gen_random_uuid()::text,
  name                     text not null,
  type                     text not null default '飲食店',
  company_name             text,
  owner_name               text,
  contact_name             text,
  email                    text unique not null,
  password                 text not null,
  plan                     text not null default 'light',
  billing_cycle            text not null default 'monthly', -- monthly / yearly
  monthly_price            int,
  setup_fee_paid_amount    int default 0,
  place_id                 text,
  status                   text not null default 'active',
  pending_plan             text,
  pending_billing_cycle    text,
  downgrade_scheduled_plan text,
  downgrade_effective_date text,
  next_billing_date        text,
  square_customer_id       text,
  square_order_id          text,
  subscription_id          text,
  referral_code            text,
  setup_fee_paid_at        timestamp,
  created_at               timestamp default now(),
  updated_at               timestamp default now()
);

-- 月次利用数テーブル
create table monthly_usage (
  id         bigserial primary key,
  store_id   text references stores(id) on delete cascade,
  year_month text not null,           -- 例: "2026-04"
  count      int not null default 0,
  created_at timestamp default now(),
  unique(store_id, year_month)
);

-- 質問カスタマイズテーブル
create table questions (
  id         bigserial primary key,
  store_id   text references stores(id) on delete cascade,
  order_num  int not null,
  label      text not null,
  type       text not null,           -- stars / multi / select
  options    jsonb,                   -- 選択肢の配列
  created_at timestamp default now()
);

-- プラン定義テーブル
create table plans (
  key         text primary key,
  name        text not null,
  price       int not null,
  monthly_limit int not null,        -- 99999 = 無制限
  features    jsonb
);

-- 初期プランデータ
insert into plans values
  ('light',    'ライト',        2980,   30,    '["口コミ生成：月30件","AI文章自動生成","専用QRコード"]'),
  ('standard', 'スタンダード',  5980,   100,   '["口コミ生成：月100件","AI返信文生成","低評価フィルター","月次レポート"]'),
  ('premium',  'プレミアム',    9800,   99999, '["口コミ生成：無制限","GBP自動投稿（月4回）","全機能込み","優先サポート"]');

-- デモ用店舗データ（テスト用）
insert into stores (id, name, type, owner_name, email, password, plan, place_id) values
  ('store-001', '博多ラーメン 一風堂風', '飲食店', '田中 太郎', 'tanaka@example.com', '1234', 'light',    'ChIJxxxxxx'),
  ('store-002', 'ヘアサロン BLOOM',      '美容室', '佐藤 花子', 'sato@example.com',   '1234', 'standard', 'ChIJyyyyyy');

-- 解約申請テーブル
-- ※ 既存DBの場合: ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS cancellation_fee int default 0;
-- ※ 既存DBの場合: ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS remaining_months int default 0;
create table cancellation_requests (
  id                bigserial primary key,
  store_id          text references stores(id) on delete cascade,
  request_type      text not null default 'store',
  reason            text,
  requested_at      timestamp not null default now(),
  effective_date    text,
  status            text not null default 'pending', -- pending / approved / rejected
  cancellation_fee  int not null default 0,
  remaining_months  int not null default 0,
  handled_at        timestamp,
  handled_by        text,
  created_at        timestamp default now()
);

-- 同意ログテーブル
create table consent_logs (
  id            bigserial primary key,
  store_id      text references stores(id) on delete cascade,
  consented_at  timestamp not null default now(),
  ip_address    text,
  terms_version text not null,
  created_at    timestamp default now()
);

-- RLS（Row Level Security）を有効化
alter table stores                  enable row level security;
alter table monthly_usage           enable row level security;
alter table questions               enable row level security;
alter table cancellation_requests   enable row level security;
alter table consent_logs            enable row level security;

-- サービスロールはすべてアクセス可能（サーバーサイドAPIから使う）
create policy "service role full access" on stores                for all using (true);
create policy "service role full access" on monthly_usage         for all using (true);
create policy "service role full access" on questions             for all using (true);
create policy "service role full access" on cancellation_requests for all using (true);
create policy "service role full access" on consent_logs          for all using (true);
