-- ========================================================================
-- METRICA: Supabase Database Migration
-- Purpose: Add verification_hash column for SHA-256 payment audit trails
-- ========================================================================

-- 1. Ensure verification_hash column exists on public.payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verification_hash text;

-- 2. Add an index for fast lookups by verification_hash
CREATE INDEX IF NOT EXISTS idx_payments_verification_hash 
ON public.payments (verification_hash);

-- 3. Ensure metric_rollups has the status column (Live, Delayed, Estimated)
ALTER TABLE public.metric_rollups 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'Live';

-- Optional verification query:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments';
