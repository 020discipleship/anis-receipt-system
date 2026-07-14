-- Supabase-ready schema for the school receipt issuing app.
-- The demo app stores data in the browser so it can run immediately.
-- Use this schema when connecting it to Supabase authentication and Postgres.

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table public.payment_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.payment_sub_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.payment_categories(id) on delete cascade,
  name text not null,
  default_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  receipt_date date not null,
  student_name text not null,
  grade text not null,
  class_name text not null,
  student_id text,
  parent_phone text,
  payment_method text not null default 'Cash' check (payment_method in ('Cash', 'Bank Transfer', 'Credit Card')),
  total_amount numeric(12, 2) not null default 0,
  payment_note text,
  sent_status text not null default 'not sent' check (sent_status in ('not sent', 'sent')),
  sent_method text not null default 'manual' check (sent_method in ('WhatsApp', 'SMS', 'manual')),
  sent_date timestamptz,
  receipt_image_url text,
  created_by uuid not null references public.staff_profiles(id),
  created_at timestamptz not null default now()
);

create table public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  category_id uuid references public.payment_categories(id) on delete set null,
  sub_item_id uuid references public.payment_sub_items(id) on delete set null,
  category_name text not null,
  item_name text not null,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- Simple shared-state table used by the deployed demo app for team testing.
-- It stores categories, receipts, and the receipt counter in one JSON document.
-- For production, prefer the normalized tables above with Supabase Auth.
create table public.shared_app_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.staff_profiles enable row level security;
alter table public.payment_categories enable row level security;
alter table public.payment_sub_items enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;
alter table public.shared_app_state enable row level security;

create policy "logged in staff can read profiles"
  on public.staff_profiles for select
  to authenticated
  using (true);

create policy "logged in staff can manage categories"
  on public.payment_categories for all
  to authenticated
  using (true)
  with check (true);

create policy "logged in staff can manage sub items"
  on public.payment_sub_items for all
  to authenticated
  using (true)
  with check (true);

create policy "logged in staff can manage receipts"
  on public.receipts for all
  to authenticated
  using (true)
  with check (true);

create policy "logged in staff can manage receipt items"
  on public.receipt_items for all
  to authenticated
  using (true)
  with check (true);

-- Demo sharing policies for the deployed test app.
-- These allow anyone with the app URL and Supabase anon key to read/write the shared test data.
-- Remove these policies before real production use.
create policy "anon can read shared demo state"
  on public.shared_app_state for select
  to anon
  using (true);

create policy "anon can insert shared demo state"
  on public.shared_app_state for insert
  to anon
  with check (true);

create policy "anon can update shared demo state"
  on public.shared_app_state for update
  to anon
  using (true)
  with check (true);
