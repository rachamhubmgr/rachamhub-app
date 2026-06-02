-- Full Supabase schema for RachamHub
-- Run this entire file in Supabase SQL editor (SQL > New query) or via psql
-- This schema intentionally uses permissive RLS for development. Harden before production.

create extension if not exists pgcrypto;

-- =====================
-- users (profiles)
-- =====================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login timestamptz
);

-- =====================
-- merchants
-- =====================
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- riders
-- =====================
create table if not exists public.riders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- landmarks
-- =====================
create table if not exists public.landmarks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- settings
-- =====================
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- =====================
-- admin_audit
-- Records privileged admin actions for auditing
-- =====================
create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.users(id) on delete set null,
  action text not null,
  target_user_id uuid,
  target_email text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit enable row level security;
create policy admin_audit_dev_allow_all on public.admin_audit for all using (true) with check (true);

-- =====================
-- orders
-- Note: `delivery_status` (shared) removed. We have role-specific fields:
--  - warehouse_delivery_status
--  - fom_delivery_status
-- Keep `status` to indicate which department currently handles the order.
-- =====================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text,
  customer_name text not null,
  delivery_address text,
  phone_numbers jsonb,
  merchant text,
  cc_comment text,
  items jsonb not null,
  total_amount numeric(12,2) default 0,
  status text not null default 'customer_service',
  warehouse_delivery_status text not null default 'pending',
  fom_delivery_status text not null default 'pending',
  inventory_status text not null default 'unpacked',
  warehouse_comment text,
  fom_assigned uuid references public.users(id) on delete set null,
  rider_name text,
  landmark text,
  price_with_rider numeric(12,2) default 0,
  payment_method text,
  payment_by_merchant numeric(12,2) default 0,
  payment_confirmed boolean not null default false,
  bank text,
  fom_comment text,
  extracted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- Trigger: keep `updated_at` current
-- =====================
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Attach triggers to tables

-- users
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users for each row execute procedure public.set_updated_at();

-- orders
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute procedure public.set_updated_at();

-- merchants
drop trigger if exists merchants_set_updated_at on public.merchants;
create trigger merchants_set_updated_at before update on public.merchants for each row execute procedure public.set_updated_at();

-- settings
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before update on public.settings for each row execute procedure public.set_updated_at();

-- riders
drop trigger if exists riders_set_updated_at on public.riders;
create trigger riders_set_updated_at before update on public.riders for each row execute procedure public.set_updated_at();

-- landmarks
drop trigger if exists landmarks_set_updated_at on public.landmarks;
create trigger landmarks_set_updated_at before update on public.landmarks for each row execute procedure public.set_updated_at();

-- =====================
-- Row Level Security (DEVELOPMENT - permissive)
-- Review and tighten before production
-- =====================
alter table public.users enable row level security;
create policy users_dev_allow_all on public.users for all using (true) with check (true);

alter table public.orders enable row level security;
create policy orders_dev_allow_all on public.orders for all using (true) with check (true);

alter table public.merchants enable row level security;
create policy merchants_dev_allow_all on public.merchants for all using (true) with check (true);

alter table public.settings enable row level security;
create policy settings_dev_allow_all on public.settings for all using (true) with check (true);

alter table public.riders enable row level security;
create policy riders_dev_allow_all on public.riders for all using (true) with check (true);

alter table public.landmarks enable row level security;
create policy landmarks_dev_allow_all on public.landmarks for all using (true) with check (true);

-- =====================
-- Indexes and constraints
-- =====================
alter table public.merchants
  add constraint merchants_pkey primary key (id);
create unique index if not exists merchants_name_key on public.merchants using btree (name);

alter table public.users
  add constraint users_pkey primary key (id);
create unique index if not exists users_email_key on public.users using btree (email);

alter table public.orders
  add constraint orders_pkey primary key (id);

-- =====================
-- Sample/demo data
-- =====================
-- Demo users (replace with actual Auth users as needed)
insert into public.users (id, email, display_name, role, is_active, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111','admin@rachamhub.com','Admin User','admin',true, now(), now()),
  ('22222222-2222-2222-2222-222222222222','cs@rachamhub.com','Customer Service','customer_service',true, now(), now()),
  ('33333333-3333-3333-3333-333333333333','demo@rachamhub.com','Demo User','customer_service',true, now(), now()),
  ('44444444-4444-4444-4444-444444444444','warehouse@rachamhub.com','Warehouse User','warehouse',true, now(), now()),
  ('55555555-5555-5555-5555-555555555555','accounting@rachamhub.com','Accounting User','accounting',true, now(), now()),
  ('66666666-6666-6666-6666-666666666666','fom1@rachamhub.com','FOM1 User','fom',true, now(), now()),
  ('77777777-7777-7777-7777-777777777777','fom2@rachamhub.com','FOM2 User','fom',true, now(), now())
on conflict do nothing;

-- Merchants
insert into public.merchants (name, is_active) values
  ('Merchant A', true),
  ('Merchant B', true),
  ('Merchant C', true) on conflict do nothing;

-- Riders
insert into public.riders (name, phone, is_active) values
  ('Ikechukwu Okonkwo', '+234-8050000001', true),
  ('Chinedu Eze', '+234-8050000002', true),
  ('Tunde Adeyemi', '+234-8050000003', true) on conflict do nothing;

-- Landmarks
insert into public.landmarks (name, price, is_active) values
  ('Lekki Phase 1', 500.00, true),
  ('Victoria Island', 600.00, true),
  ('Ikoyi', 550.00, true),
  ('Surulere', 400.00, true),
  ('Yaba', 350.00, true),
  ('Ajah', 650.00, true) on conflict do nothing;

-- Settings
insert into public.settings (key, value) values
  ('order_prefix', 'RCH-'),
  ('session_timeout', '60'),
  ('fom_names', 'FOM1,FOM2,FOM3')
on conflict (key) do update set value = excluded.value;

-- Sample orders (note: we populate both warehouse and fom delivery status)
insert into public.orders (order_reference, customer_name, delivery_address, phone_numbers, merchant, cc_comment, items, total_amount, warehouse_delivery_status, fom_delivery_status, inventory_status, fom_assigned, fom_comment, extracted_by, created_at, updated_at)
values
  ('RCH-0001','Demo Customer A','22 Bishop Street, Surulere, Lagos','["08012345678","08087654321"]','Merchant A','Extracted via demo','[{"name":"Product A","quantity":5,"weight":2}]',500.00,'pending','pending','unpacked','77777777-7777-7777-7777-777777777777','Extracted via demo','22222222-2222-2222-2222-222222222222', now(), now()),
  ('RCH-0002','Warehouse Customer B','14 Ilupeju Road, Ikeja, Lagos','["08123456789"]','Merchant B',null,'[{"name":"Product B","quantity":3}]',300.00,'processing','processing','packed','44444444-4444-4444-4444-444444444444',null,'33333333-3333-3333-3333-333333333333', now(), now())
on conflict do nothing;

-- Helpful queries
-- select * from public.orders order by created_at desc;
-- select * from public.merchants order by name;

-- End of schema
