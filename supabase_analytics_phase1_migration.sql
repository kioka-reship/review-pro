-- =====================================================
-- REVIEW PRO PREMIUM Phase 1 analytics tables
-- Run manually in Supabase SQL Editor after review.
-- This migration only adds new analytics tables and policies.
-- It does not alter or drop existing application tables.
-- =====================================================

create table if not exists survey_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,
  store_id text not null references stores(id) on delete cascade,
  status text not null default 'accessed'
    check (status in ('accessed', 'started', 'completed', 'abandoned', 'low_review_completed')),
  rating int check (rating between 1 and 5),
  language text not null default 'ja',
  started_at timestamptz,
  completed_at timestamptz,
  ai_generated_at timestamptz,
  google_review_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_survey_sessions_store_created
  on survey_sessions (store_id, created_at desc);
create index if not exists idx_survey_sessions_store_completed
  on survey_sessions (store_id, completed_at desc)
  where completed_at is not null;
create index if not exists idx_survey_sessions_store_rating
  on survey_sessions (store_id, rating)
  where rating is not null;

create table if not exists survey_answers (
  id bigserial primary key,
  session_id uuid not null references survey_sessions(session_id) on delete cascade,
  store_id text not null references stores(id) on delete cascade,
  question_id bigint references questions(id) on delete set null,
  question_order int not null check (question_order > 0),
  question_label text not null,
  question_type text not null check (question_type in ('stars', 'select', 'multi', 'text')),
  answer_value jsonb not null,
  answer_text text,
  created_at timestamptz not null default now(),
  unique (session_id, question_order)
);

create index if not exists idx_survey_answers_store_created
  on survey_answers (store_id, created_at desc);
create index if not exists idx_survey_answers_store_question
  on survey_answers (store_id, question_id)
  where question_id is not null;
create index if not exists idx_survey_answers_store_question_label
  on survey_answers (store_id, question_label);

create table if not exists survey_events (
  id bigserial primary key,
  session_id uuid references survey_sessions(session_id) on delete set null,
  store_id text not null references stores(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'qr_access',
      'survey_started',
      'survey_completed',
      'ai_generated',
      'ai_generation_failed',
      'google_review_clicked'
    )),
  event_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_survey_events_one_shot
  on survey_events (session_id, event_type)
  where event_type in ('qr_access', 'survey_started', 'survey_completed', 'google_review_clicked')
    and session_id is not null;

create unique index if not exists uq_survey_events_event_key
  on survey_events (session_id, event_type, event_key)
  where event_key is not null
    and session_id is not null;

create index if not exists idx_survey_events_store_created
  on survey_events (store_id, created_at desc);
create index if not exists idx_survey_events_store_type_created
  on survey_events (store_id, event_type, created_at desc);

alter table survey_sessions enable row level security;
alter table survey_answers enable row level security;
alter table survey_events enable row level security;

drop policy if exists "service role full access" on survey_sessions;
drop policy if exists "service role full access" on survey_answers;
drop policy if exists "service role full access" on survey_events;

create policy "service role full access" on survey_sessions
  for all to service_role using (true) with check (true);
create policy "service role full access" on survey_answers
  for all to service_role using (true) with check (true);
create policy "service role full access" on survey_events
  for all to service_role using (true) with check (true);
