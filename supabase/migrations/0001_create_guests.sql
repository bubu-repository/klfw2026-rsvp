-- Guests table: one row per RSVP, one ticket per guest.
create extension if not exists pgcrypto;

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ticket_hash text not null unique,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

-- One RSVP per email address.
create unique index guests_email_unique on public.guests (lower(email));
-- Scanner looks tickets up by hash constantly on event day.
create index guests_ticket_hash_idx on public.guests (ticket_hash);

-- Lock the table down: the browser never talks to it directly.
-- All reads/writes go through Next.js route handlers using the
-- service-role key, which bypasses RLS on the server only.
alter table public.guests enable row level security;

-- Atomic check-in. A single UPDATE guarded by "checked_in = false"
-- means two organizers scanning the same ticket at the same moment
-- cannot both succeed: exactly one gets 'checked_in', the other
-- gets 'already_checked_in'. No read-then-write race.
create or replace function public.check_in_guest(p_ticket_hash text)
returns table (status text, guest_name text, guest_email text, at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guest guests%rowtype;
begin
  update guests
     set checked_in = true,
         checked_in_at = now()
   where ticket_hash = p_ticket_hash
     and checked_in = false
  returning * into v_guest;

  if found then
    return query select 'checked_in'::text, v_guest.name, v_guest.email, v_guest.checked_in_at;
    return;
  end if;

  select * into v_guest from guests where ticket_hash = p_ticket_hash;

  if found then
    return query select 'already_checked_in'::text, v_guest.name, v_guest.email, v_guest.checked_in_at;
  else
    return query select 'not_found'::text, null::text, null::text, null::timestamptz;
  end if;
end;
$$;

-- Only the service role may call the check-in function.
revoke execute on function public.check_in_guest(text) from public, anon, authenticated;
