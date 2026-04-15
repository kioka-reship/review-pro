-- =============================
-- Review Pro データベース設計
-- Supabaseのエディタにそのまま貼り付けて実行してください
-- =============================

-- 店舗テーブル
create table stores (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  type        text not null default '飲食店',
  owner_name  text,
  email       text unique not null,
  password    text not null,          -- 本番ではハッシュ化すること
  plan        text not null default 'light',
  place_id    text,                   -- GoogleマップのPlace ID
  status      text not null default 'active', -- active / inactive
  created_at  timestamp default now(),
  updated_at  timestamp default now()
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

-- RLS（Row Level Security）を有効化
alter table stores         enable row level security;
alter table monthly_usage  enable row level security;
alter table questions      enable row level security;

-- サービスロールはすべてアクセス可能（サーバーサイドAPIから使う）
create policy "service role full access" on stores         for all using (true);
create policy "service role full access" on monthly_usage  for all using (true);
create policy "service role full access" on questions      for all using (true);
