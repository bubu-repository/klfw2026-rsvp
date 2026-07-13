-- Guest details + VIP category. Run this AFTER 0001. Safe to run twice.
--
-- Adds: phone, company, title (Manager / C-Level / Investor), after-party
-- confirmation, and a category column that separates VIP RSVPs (from
-- klfw-vip.culturedbytodak.com) from regular ones. One doorlist, filterable.

alter table public.guests add column if not exists phone text;
alter table public.guests add column if not exists company text;
alter table public.guests add column if not exists title text;
alter table public.guests add column if not exists attending_after_party boolean not null default false;
alter table public.guests add column if not exists category text not null default 'regular';

-- Keep category to the two known values (idempotent: drop + re-add).
alter table public.guests drop constraint if exists guests_category_check;
alter table public.guests
  add constraint guests_category_check check (category in ('regular', 'vip'));

-- The check-in function now also reports category and after-party status so
-- door staff see "VIP" the moment they scan. Return type changes, so the old
-- function must be dropped first (create or replace can't change columns).
drop function if exists public.check_in_guest(text);

create function public.check_in_guest(p_ticket_hash text)
returns table (
  status text,
  guest_name text,
  guest_email text,
  at timestamptz,
  guest_category text,
  after_party boolean
)
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
    return query select 'checked_in'::text, v_guest.name, v_guest.email,
      v_guest.checked_in_at, v_guest.category, v_guest.attending_after_party;
    return;
  end if;

  select * into v_guest from guests where ticket_hash = p_ticket_hash;

  if found then
    return query select 'already_checked_in'::text, v_guest.name, v_guest.email,
      v_guest.checked_in_at, v_guest.category, v_guest.attending_after_party;
  else
    return query select 'not_found'::text, null::text, null::text,
      null::timestamptz, null::text, null::boolean;
  end if;
end;
$$;

revoke execute on function public.check_in_guest(text) from public, anon, authenticated;
