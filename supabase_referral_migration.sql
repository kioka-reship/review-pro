-- =====================================================
-- Referral codes + Google Sheets sync migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id                  uuid primary key default gen_random_uuid(),
  code                text unique not null,
  sales_person_name   text,
  channel_name        text,
  commission_enabled  boolean not null default false,
  is_active           boolean not null default true,
  memo                text,
  created_at          timestamp default now(),
  updated_at          timestamp default now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON referral_codes FOR ALL USING (true);

-- 2. Add columns to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS referral_id uuid references referral_codes(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sales_person_name text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sales_channel text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sheet_synced_at timestamp;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS sheet_sync_status text; -- 'synced' / 'failed' / null

-- 3. Seed existing referral codes from hardcoded values
INSERT INTO referral_codes (code, sales_person_name, channel_name, is_active, memo)
VALUES
  ('BNI-MEMBER', '', 'BNI', true, 'BNI会員向け紹介コード'),
  ('0CP', '', '直販', true, '初期費用無料キャンペーン')
ON CONFLICT (code) DO NOTHING;
