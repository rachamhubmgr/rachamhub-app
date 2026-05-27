-- Supabase init SQL for RachamHub
-- Creates `users` and `orders` tables, triggers, permissive RLS (development),
-- and inserts demo user/profile rows + sample orders.
--
-- Usage:
-- 1) Run this in the Supabase SQL editor (SQL > New query) OR via psql
--    connected to your project's Postgres DB (service_role key required for
--    operations that affect auth schema). For typical setup, you only need
--    to run this in the project SQL editor.
-- 2) Create matching Auth users in Supabase Auth (Dashboard → Authentication)
--    using the `id` values shown below (or update the `users` table ids to
--    match the auth users you create).
-- WARNING: RLS policies below are permissive for developer convenience.
-- Review and tighten them before deploying to production.
-- Ensure pgcrypto is available for gen_random_uuid()
create extension if not exists pgcrypto;
-- =====================
-- users table (profiles)
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
-- orders table
-- =====================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  delivery_address text,
  phone_numbers jsonb,
  merchant text,
  cc_comment text,
  items jsonb not null,
  total_amount numeric(12, 2) default 0,
  status text not null default 'customer_service',
  delivery_status text not null default 'pending',
  inventory_status text not null default 'unpacked',
  warehouse_comment text,
  fom_assigned uuid references public.users(id) on delete
  set null,
    rider_name text,
    landmark text,
    price_with_rider numeric(12, 2) default 0,
    payment_method text,
    payment_by_merchant numeric(12, 2) default 0,
    payment_confirmed boolean not null default false,
    bank text,
    fom_comment text,
    extracted_by uuid references public.users(id) on delete
  set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
-- =====================
-- merchants table
-- =====================
create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- =====================
-- system settings table
-- =====================
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
-- =====================
-- Trigger: keep updated_at current
-- =====================
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at := now();
return new;
end;
$$;
drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before
update on public.users for each row execute procedure public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before
update on public.orders for each row execute procedure public.set_updated_at();
drop trigger if exists merchants_set_updated_at on public.merchants;
create trigger merchants_set_updated_at before
update on public.merchants for each row execute procedure public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at before
update on public.settings for each row execute procedure public.set_updated_at();
-- =====================
-- Row Level Security (DEVELOPMENT - permissive)
-- Review and harden before production
-- =====================
alter table public.users enable row level security;
create policy users_dev_allow_all on public.users for all using (true) with check (true);
alter table public.orders enable row level security;
create policy orders_dev_allow_all on public.orders for all using (true) with check (true);
alter table public.merchants enable row level security;
create policy merchants_dev_allow_all on public.merchants for all using (true) with check (true);
alter table public.settings enable row level security;
create policy settings_dev_allow_all on public.settings for all using (true) with check (true);
-- =====================
-- Sample/demo data
-- Use explicit UUIDs so you can create matching Auth users if desired
-- =====================
-- Demo user IDs (feel free to replace with your actual auth user ids)
-- admin: 11111111-1111-1111-1111-111111111111
-- customer_service: 22222222-2222-2222-2222-222222222222
-- warehouse:: 44444444-4444-4444-4444-444444444444
-- accounting: 55555555-5555-5555-5555-555555555555
-- fom1: 66666666-6666-6666-6666-666666666666
insert into public.users (
    id,
    email,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  )
values (
    '11111111-1111-1111-1111-111111111111',
    'admin@rachamhub.com',
    'Admin User',
    'admin',
    true,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'cs@rachamhub.com',
    'Customer Service',
    'customer_service',
    true,
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'demo@rachamhub.com',
    'Demo User',
    'customer_service',
    true,
    now(),
    now()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'warehouse@rachamhub.com',
    'Warehouse User',
    'warehouse',
    true,
    now(),
    now()
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'accounting@rachamhub.com',
    'Accounting User',
    'accounting',
    true,
    now(),
    now()
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'fom1@rachamhub.com',
    'FOM1 User',
    'fom',
    true,
    now(),
    now()
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'fom2@rachamhub.com',
    'FOM2 User',
    'fom',
    true,
    now(),
    now()
  ) on conflict do nothing;
-- Sample orders
insert into public.orders (
    order_reference,
    customer_name,
    delivery_address,
    phone_numbers,
    merchant,
    comment,
    items,
    total_amount,
    delivery_status,
    inventory_status,
    fom_assigned,
    fom_comment,
    extracted_by,
    created_at,
    updated_at
  )
values (
    'RCH-0001',
    'Demo Customer A',
    '22 Bishop Street, Surulere, Lagos',
    '["08012345678", "08087654321"]',
    'Merchant A',
    'Extracted via demo',
    '[{"name":"Product A","quantity":5,"weight":2}]',
    500.00,
    'pending',
    'unpacked',
    '77777777-7777-7777-7777-777777777777',
    'Extracted via demo',
    '22222222-2222-2222-2222-222222222222',
    now(),
    now()
  ),
  (
    'RCH-0002',
    'Warehouse Customer B',
    '14 Ilupeju Road, Ikeja, Lagos',
    '["08123456789"]',
    'Merchant B',
    null,
    '[{"name":"Product B","quantity":3}]',
    300.00,
    'processing',
    'packed',
    '44444444-4444-4444-4444-444444444444',
    null,
    '33333333-3333-3333-3333-333333333333',
    now(),
    now()
  ) on conflict do nothing;
insert into public.merchants (name, is_active)
values ('Merchant A', true),
  ('Merchant B', true),
  ('Merchant C', true) on conflict do nothing;
insert into public.settings (key, value)
values ('order_prefix', 'RCH-'),
  ('session_timeout', '60'),
  ('fom_names', 'FOM1,FOM2,FOM3') on conflict do nothing;
-- Customer inquiries
create table if not exists public.customer_inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
insert into public.customer_inquiries (
    customer_name,
    customer_email,
    subject,
    message,
    status,
    created_at,
    updated_at
  )
values (
    'Demo Customer A',
    'demo.customer@example.com',
    'Question about shipping',
    'Can you confirm the delivery date for my order?',
    'open',
    now(),
    now()
  ),
  (
    'Warehouse Customer B',
    'warehouse.customer@example.com',
    'Order update needed',
    'Please update my order destination address.',
    'in_progress',
    now(),
    now()
  ),
  (
    'Test Customer C',
    'test.customer@example.com',
    'Invoice clarification',
    'I need more information about the invoice total.',
    'open',
    now(),
    now()
  ) on conflict do nothing;
-- =====================
-- Helpful queries / notes
-- To list users:
--   select * from public.users order by created_at desc;
-- To list orders:
--   select id, customer_name, total_amount, status, created_at from public.orders order by created_at desc;
-- Creating Auth users (recommended):
-- - Go to Supabase Dashboard → Authentication → Users → New user
-- - Use the emails above and set passwords (e.g., Demo123!)
-- - After creating an auth user, update the `public.users` row `id` to match the Auth user `id`, or recreate the profile row with that id.
-- RLS/security reminder:
-- The policies in this script are intentionally open to make local development easy.
-- Before production, replace policies with fine-grained rules, for example:
--   - Allow users to read/update only their own profile (auth.uid() = id)
--   - Allow admins to read/update all rows
--   - Allow orders creation by authenticated users and updates by owner or admin
-- End of script