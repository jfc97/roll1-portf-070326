-- ============================================================
-- RLS Policies for crypto-portf
-- Run this in Supabase SQL editor AFTER supabase_schema.sql
-- ============================================================
-- NOTE: This app uses a single-user model with the anon key.
-- RLS is enabled on all tables but allows full access to the
-- anon role so the app works without auth. To restrict access
-- to an authenticated user only, replace the policies below
-- with auth.uid()-based checks after setting up Supabase Auth.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE platforms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains          ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins           ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_prices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_positions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_fee_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: grant full CRUD to anon (single-user app)
-- ============================================================

-- platforms
CREATE POLICY "anon_all_platforms" ON platforms FOR ALL TO anon USING (true) WITH CHECK (true);

-- locations
CREATE POLICY "anon_all_locations" ON locations FOR ALL TO anon USING (true) WITH CHECK (true);

-- chains
CREATE POLICY "anon_all_chains" ON chains FOR ALL TO anon USING (true) WITH CHECK (true);

-- coins
CREATE POLICY "anon_all_coins" ON coins FOR ALL TO anon USING (true) WITH CHECK (true);

-- coin_prices
CREATE POLICY "anon_all_coin_prices" ON coin_prices FOR ALL TO anon USING (true) WITH CHECK (true);

-- positions
CREATE POLICY "anon_all_positions" ON positions FOR ALL TO anon USING (true) WITH CHECK (true);

-- position_snapshots
CREATE POLICY "anon_all_position_snapshots" ON position_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);

-- lp_positions
CREATE POLICY "anon_all_lp_positions" ON lp_positions FOR ALL TO anon USING (true) WITH CHECK (true);

-- lp_fee_entries
CREATE POLICY "anon_all_lp_fee_entries" ON lp_fee_entries FOR ALL TO anon USING (true) WITH CHECK (true);

-- lp_snapshots
CREATE POLICY "anon_all_lp_snapshots" ON lp_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);

-- transactions
CREATE POLICY "anon_all_transactions" ON transactions FOR ALL TO anon USING (true) WITH CHECK (true);
