-- ============================================================================
-- Z Natural Foods Survey Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run)
-- It's safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: submissions
-- One row per completed survey. This is the main "responses sheet."
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  -- Primary key + when it was saved
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Session
  session_id              TEXT,

  -- Customer identity (any may be null)
  email                   TEXT,
  klaviyo_id              TEXT,

  -- Path / segmentation
  path_id                 TEXT NOT NULL,        -- 'path1' ... 'path6'
  path_name               TEXT,                  -- e.g. 'Recent Buyer Feedback'

  -- How they finished
  submitted_via           TEXT NOT NULL,         -- 'email' or 'skip'
  coupon_code             TEXT,                  -- 'FEEDBACK30' or 'FEEDBACK20'
  discount_label          TEXT,                  -- '30% OFF' or '20% OFF'

  -- Sorting question (page 1)
  sorting_answer_id       TEXT,
  sorting_answer_label    TEXT,
  sorting_free_text       TEXT,

  -- All path question answers (full JSON for flexibility)
  -- Structure: [{questionId, questionTitle, answerId, answerLabel, freeText}, ...]
  answers                 JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Browser / device metadata
  user_agent              TEXT,
  ip_address              TEXT,
  referrer                TEXT,
  locale                  TEXT,
  timezone                TEXT,
  screen_width            INTEGER,
  screen_height           INTEGER,

  -- Marketing attribution
  utm_source              TEXT,
  utm_medium              TEXT,
  utm_campaign            TEXT,
  utm_term                TEXT,
  utm_content             TEXT,

  -- Behavior signals
  time_to_complete_ms     INTEGER,
  back_count              INTEGER,
  answer_changes_count    INTEGER
);

CREATE INDEX IF NOT EXISTS submissions_path_id_idx       ON public.submissions(path_id);
CREATE INDEX IF NOT EXISTS submissions_submitted_at_idx  ON public.submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS submissions_email_idx         ON public.submissions(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS submissions_submitted_via_idx ON public.submissions(submitted_via);

-- ----------------------------------------------------------------------------
-- TABLE: events
-- Fine-grained tracking — one row per click/advance/back.
-- Optional, used for funnel analysis & drop-off insight.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id        TEXT NOT NULL,
  event_type        TEXT NOT NULL,         -- e.g. 'page_view', 'answer_select', 'free_text_blur', 'step_advance', 'step_back', 'submit', 'skip'
  step              INTEGER,
  path_id           TEXT,
  question_id       TEXT,
  question_title    TEXT,
  answer_id         TEXT,
  answer_label      TEXT,
  free_text_length  INTEGER,
  email             TEXT,
  klaviyo_id        TEXT,
  url               TEXT,
  referrer          TEXT,
  user_agent        TEXT,
  ip_address        TEXT,
  metadata          JSONB
);

CREATE INDEX IF NOT EXISTS events_session_id_idx ON public.events(session_id);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON public.events(event_type);
CREATE INDEX IF NOT EXISTS events_timestamp_idx  ON public.events(timestamp DESC);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Enable RLS but allow the server-side service_role key full access.
-- The anon key (browser) gets NO direct access — all writes go through our API.
-- ----------------------------------------------------------------------------
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;

-- (Service role bypasses RLS automatically, so no policies are required for it.)
-- We're intentionally creating no policies for anon users.
