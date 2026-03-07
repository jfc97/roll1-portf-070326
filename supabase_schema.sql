-- ============================================================
-- Crypto-portf  ·  Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Platforms ──────────────────────────────────────────────
create table if not exists platforms (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  custody_type text not null check (custody_type in ('DEX','CEX','Wallet')),
  created_at   timestamptz default now()
);

-- ─── Locations ──────────────────────────────────────────────
create table if not exists locations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  platform_id  uuid not null references platforms(id) on delete cascade,
  created_at   timestamptz default now()
);

-- ─── Chains ─────────────────────────────────────────────────
create table if not exists chains (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  logo_url     text,
  created_at   timestamptz default now()
);

-- ─── Coins (user-defined) ───────────────────────────────────
create table if not exists coins (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  symbol         text not null,
  coingecko_id   text not null unique,
  logo_url       text,
  created_at     timestamptz default now()
);

-- ─── Coin Prices (daily cache) ──────────────────────────────
create table if not exists coin_prices (
  id       uuid primary key default gen_random_uuid(),
  coin_id  uuid not null references coins(id) on delete cascade,
  date     date not null,
  price_usd numeric(20,8) not null,
  unique(coin_id, date)
);
create index if not exists coin_prices_coin_date on coin_prices(coin_id, date desc);

-- ─── Positions ──────────────────────────────────────────────
create table if not exists positions (
  id               uuid primary key default gen_random_uuid(),
  status           text not null default 'open' check (status in ('open','closed','cancelled')),
  coin_id          uuid not null references coins(id),
  location_id      uuid not null references locations(id),
  platform_id      uuid not null references platforms(id),
  chain_id         uuid references chains(id),
  quantity         numeric(30,10) not null,
  unit_price_usd   numeric(20,8) not null,
  purchase_date    date not null,
  cost_coin        text not null default 'USDT',
  cost_units       numeric(30,10) not null,
  cost_price       numeric(20,8) not null,
  cost_total_usd   numeric(20,8) not null,
  notes            text,
  closed_at        timestamptz,
  realized_pnl_usd numeric(20,8),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── Position Snapshots ─────────────────────────────────────
create table if not exists position_snapshots (
  id           uuid primary key default gen_random_uuid(),
  position_id  uuid not null references positions(id) on delete cascade,
  date         date not null,
  value_usd    numeric(20,8) not null,
  pnl_pct      numeric(10,4) not null,
  max_drawdown numeric(10,4) not null default 0,
  max_profit   numeric(10,4) not null default 0,
  unique(position_id, date)
);
create index if not exists pos_snap_position_date on position_snapshots(position_id, date asc);

-- ─── LP Positions ────────────────────────────────────────────
create table if not exists lp_positions (
  id                uuid primary key default gen_random_uuid(),
  status            text not null default 'open' check (status in ('open','closed','cancelled')),
  coin1_id          uuid not null references coins(id),
  qty1              numeric(30,10) not null,
  price1            numeric(20,8) not null,
  coin2_id          uuid not null references coins(id),
  qty2              numeric(30,10) not null,
  price2            numeric(20,8) not null,
  initial_value_usd numeric(20,8) not null,
  location_id       uuid not null references locations(id),
  platform_id       uuid not null references platforms(id),
  chain_id          uuid references chains(id),
  notes             text,
  closed_at         timestamptz,
  realized_pnl_usd  numeric(20,8),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── LP Fee Entries ──────────────────────────────────────────
create table if not exists lp_fee_entries (
  id             uuid primary key default gen_random_uuid(),
  lp_id          uuid not null references lp_positions(id) on delete cascade,
  date           date not null,
  fee_coin1      numeric(30,10) not null default 0,
  fee_coin2      numeric(30,10) not null default 0,
  fee_usd_total  numeric(20,8) not null default 0,
  created_at     timestamptz default now()
);

-- ─── LP Snapshots ────────────────────────────────────────────
create table if not exists lp_snapshots (
  id             uuid primary key default gen_random_uuid(),
  lp_id          uuid not null references lp_positions(id) on delete cascade,
  date           date not null,
  value_usd      numeric(20,8) not null,
  hold_value_usd numeric(20,8) not null,
  unique(lp_id, date)
);

-- ─── Transactions (audit log) ────────────────────────────────
create table if not exists transactions (
  id             uuid primary key default gen_random_uuid(),
  type           text not null,
  entity_id      text not null,
  entity_type    text not null,
  payload_before jsonb,
  payload_after  jsonb,
  created_at     timestamptz default now()
);
create index if not exists tx_created_at on transactions(created_at desc);

-- ─── updated_at trigger ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger positions_updated_at before update on positions
  for each row execute function update_updated_at();

create trigger lp_positions_updated_at before update on lp_positions
  for each row execute function update_updated_at();
