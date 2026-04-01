-- Run this in your Supabase SQL editor

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  pro boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  pro_started_at timestamptz,
  created_at timestamptz default now()
);

create table usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  count integer default 0,
  unique(user_id, date)
);

create index on usage(user_id, date);
