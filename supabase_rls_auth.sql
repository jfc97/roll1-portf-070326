-- ============================================================
-- RLS Auth Upgrade for crypto-portf
-- Run this in Supabase SQL editor INSTEAD of supabase_rls.sql
-- Drops permissive anon policies and replaces them with
-- authenticated-only policies.
-- ============================================================

-- Drop old anon policies (from supabase_rls.sql)
DROP POLICY IF EXISTS "anon_all_platforms"           ON platforms;
DROP POLICY IF EXISTS "anon_all_locations"           ON locations;
DROP POLICY IF EXISTS "anon_all_chains"              ON chains;
DROP POLICY IF EXISTS "anon_all_coins"               ON coins;
DROP POLICY IF EXISTS "anon_all_coin_prices"         ON coin_prices;
DROP POLICY IF EXISTS "anon_all_positions"           ON positions;
DROP POLICY IF EXISTS "anon_all_position_snapshots"  ON position_snapshots;
DROP POLICY IF EXISTS "anon_all_lp_positions"        ON lp_positions;
DROP POLICY IF EXISTS "anon_all_lp_fee_entries"      ON lp_fee_entries;
DROP POLICY IF EXISTS "anon_all_lp_snapshots"        ON lp_snapshots;
DROP POLICY IF EXISTS "anon_all_transactions"        ON transactions;

-- ============================================================
-- New policies: authenticated users only
-- RLS is already ENABLED on all tables (from supabase_rls.sql)
-- ============================================================

CREATE POLICY "auth_all_platforms" ON platforms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_locations" ON locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_chains" ON chains
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_coins" ON coins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_coin_prices" ON coin_prices
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_positions" ON positions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_position_snapshots" ON position_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_lp_positions" ON lp_positions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_lp_fee_entries" ON lp_fee_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_lp_snapshots" ON lp_snapshots
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_all_transactions" ON transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
