-- =====================================================
-- Google口コミURL migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- stores.google_review_url: 店舗ごとのGoogle口コミ投稿URL（例: https://g.page/r/xxxx/review）
-- 未設定の場合は従来通り place_id 列（実体はURL）にフォールバックする。
ALTER TABLE stores ADD COLUMN IF NOT EXISTS google_review_url text;
