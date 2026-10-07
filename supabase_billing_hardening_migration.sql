-- REVIEW PRO billing hardening migration
-- 実行前にSupabase本番DBのバックアップを取得してください。
-- このファイルは作成のみで、本タスクでは実行していません。

-- 1) stores.status の旧値を現行値へ寄せる
update stores
set status = '契約中', updated_at = now()
where status = 'active';

update stores
set status = '入金待ち', updated_at = now()
where status = 'pending_payment';

alter table stores
alter column status set default '入金待ち';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stores_status_allowed'
  ) then
    alter table stores
    add constraint stores_status_allowed
    check (status in ('契約中', '入金待ち', '停止中', '仮申込', '解約予約', '解約済'))
    not valid;
  end if;
end $$;

-- 既存データの全statusを確認後、問題なければ手動で実行してください。
-- alter table stores validate constraint stores_status_allowed;

-- 2) stores.billing_provider を追加して、Square課金監視対象を明示する
-- defaultはmanualです。通常signup/APIはアプリ側で明示的にsquareを設定します。
alter table stores
add column if not exists billing_provider text default 'manual';

update stores
set billing_provider = 'manual'
where billing_provider is null;

-- 確認済みの無料/テスト店舗はSquare課金監視対象外
update stores
set billing_provider = 'none', updated_at = now()
where id in (
  'f4744b05-ec50-4d9b-863a-2fbe041dc981', -- Plus Belle
  '008c94b0-3f70-48d7-b4c0-fae3fc4b3652', -- コーネリアス
  'b201bb92-f269-4b4c-9aaf-8a80f832af82', -- テスト店舗
  '7ad1c399-20dd-45e9-bf1d-42d60803d9a6', -- テスト店舗
  '3b6c043d-22bb-4c9c-b385-337688c01574'  -- 本番テスト店舗
);

-- ZYNXはSquare Subscriptionを一意確認できるまで手動管理扱い
update stores
set billing_provider = 'manual', updated_at = now()
where id = '2ea0d201-59ce-436f-b9b8-0b86b2d7a5cd';

do $$
begin
  if exists (
    select 1
    from stores
    where billing_provider not in ('square', 'manual', 'none')
  ) then
    raise exception 'Invalid stores.billing_provider rows exist. Resolve them manually before adding the CHECK constraint.';
  end if;
end $$;

alter table stores
alter column billing_provider set default 'manual';

alter table stores
alter column billing_provider set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stores_billing_provider_allowed'
  ) then
    alter table stores
    add constraint stores_billing_provider_allowed
    check (billing_provider in ('square', 'manual', 'none'))
    not valid;
  end if;
end $$;

-- 既存データの全billing_providerを確認後、問題なければ手動で実行してください。
-- alter table stores validate constraint stores_billing_provider_allowed;

-- 3) Square Webhook冪等性テーブル
create table if not exists webhook_events (
  id bigserial primary key,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'received',
  attempts int not null default 0,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table webhook_events
add column if not exists status text not null default 'received';

alter table webhook_events
add column if not exists attempts int not null default 0;

alter table webhook_events
add column if not exists received_at timestamptz not null default now();

alter table webhook_events
add column if not exists processed_at timestamptz;

alter table webhook_events
add column if not exists last_error text;

alter table webhook_events
add column if not exists created_at timestamptz not null default now();

alter table webhook_events
add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'webhook_events_status_allowed'
  ) then
    alter table webhook_events
    add constraint webhook_events_status_allowed
    check (status in ('received', 'processing', 'processed', 'failed'))
    not valid;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from webhook_events
    group by event_id
    having count(*) > 1
  ) then
    raise exception 'Duplicate webhook_events.event_id rows exist. Resolve duplicates manually before adding the unique index.';
  end if;
end $$;

create unique index if not exists webhook_events_event_id_key
on webhook_events(event_id);

create index if not exists webhook_events_status_idx
on webhook_events(status);

-- 4) 課金状態変更ログ
create table if not exists billing_event_logs (
  id bigserial primary key,
  store_id text references stores(id) on delete set null,
  square_event_id text,
  subscription_id text,
  old_status text,
  new_status text,
  event_type text not null,
  source text not null,
  success boolean not null,
  reason text,
  detail jsonb,
  processed_at timestamptz not null default now()
);

create index if not exists billing_event_logs_store_id_idx
on billing_event_logs(store_id);

create index if not exists billing_event_logs_square_event_id_idx
on billing_event_logs(square_event_id);

create index if not exists billing_event_logs_subscription_id_idx
on billing_event_logs(subscription_id);

-- 5) RLSが有効な環境でservice roleを明示する場合
alter table webhook_events enable row level security;
alter table billing_event_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where tablename = 'webhook_events'
      and policyname = 'service role full access'
  ) then
    create policy "service role full access" on webhook_events for all using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where tablename = 'billing_event_logs'
      and policyname = 'service role full access'
  ) then
    create policy "service role full access" on billing_event_logs for all using (true);
  end if;
end $$;
