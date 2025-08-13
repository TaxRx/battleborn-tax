BEGIN;

-- Add JSONB column to persist owner splits in reports
ALTER TABLE public.rd_reports
ADD COLUMN IF NOT EXISTS owner_splits jsonb;

COMMENT ON COLUMN public.rd_reports.owner_splits IS 'Per-owner pro-rata split details for the filing guide/report';

COMMIT;

