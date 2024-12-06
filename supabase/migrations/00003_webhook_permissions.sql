-- Create checkout_attempts table if it doesn't exist
create table if not exists public.checkout_attempts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    completed boolean default false,
    checkout_id text,
    status text
);

-- Create subscriptions table if it doesn't exist
create table if not exists public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    subscription_id text not null,
    status text not null check (status in ('active', 'cancelled', 'expired')),
    plan text not null,
    current_period_end timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add RLS policies
alter table public.checkout_attempts enable row level security;
alter table public.subscriptions enable row level security;

-- Policies for checkout_attempts
create policy "Users can view their own checkout attempts"
    on public.checkout_attempts for select
    using (auth.uid() = user_id);

create policy "Service role can manage all checkout attempts"
    on public.checkout_attempts for all
    using (auth.role() = 'service_role');

-- Policies for subscriptions
create policy "Users can view their own subscriptions"
    on public.subscriptions for select
    using (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
    on public.subscriptions for all
    using (auth.role() = 'service_role'); 