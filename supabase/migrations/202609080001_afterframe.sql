-- Run once in the SQL editor for project gjczysrzjlbxccetkjha.
-- Existing Cloudflare/D1 data remains untouched; no identities are silently remapped.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null check (char_length(username) between 1 and 60),
 avatar_url text,
 created_at timestamptz not null default now()
);
create table public.clubs (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(name) between 1 and 100),
 created_by uuid not null references public.profiles(id),
 join_code uuid not null unique default gen_random_uuid(),
 created_at timestamptz not null default now()
);
create table public.memberships (
 club_id uuid not null references public.clubs(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 primary key(club_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id,club_id);
create table public.reviews (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 movie_id bigint not null,
 movie_title text not null,
 poster_url text,
 rating smallint check(rating between 1 and 5),
 review_text text not null default '' check(char_length(review_text)<=3000),
 theatre_worthy boolean,
 liked boolean not null default false,
 screen_verdict text not null default '' check(screen_verdict in ('','theatre','home','either')),
 movie jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 unique(user_id,movie_id)
);
create table public.recommendations (
 id uuid primary key default gen_random_uuid(),
 club_id uuid not null references public.clubs(id) on delete cascade,
 sender_id uuid not null references public.profiles(id) on delete cascade,
 receiver_id uuid not null references public.profiles(id) on delete cascade,
 movie_id bigint not null,
 movie_title text not null,
 poster_url text,
 movie jsonb not null default '{}'::jsonb,
 note text not null check(char_length(note) between 1 and 3000),
 created_at timestamptz not null default now(),
 is_read boolean not null default false,
 check(sender_id<>receiver_id)
);
create index recommendations_receiver_idx on public.recommendations(receiver_id,created_at desc);
create index recommendations_club_idx on public.recommendations(club_id,created_at desc);
create table public.watchlist (
 user_id uuid not null references public.profiles(id) on delete cascade,
 movie_id bigint not null,
 movie jsonb not null,
 primary key(user_id,movie_id)
);
-- Security-definer membership helpers avoid recursive RLS policy evaluation.
create function public.is_club_member(target_club uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships where club_id=target_club and user_id=(select auth.uid()));
$$;
create function public.shares_club(target_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.memberships a join public.memberships b on a.club_id=b.club_id where a.user_id=(select auth.uid()) and b.user_id=target_user);
$$;
create function public.receiver_in_club(target_club uuid, target_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select public.is_club_member(target_club) and exists(select 1 from public.memberships where club_id=target_club and user_id=target_user);
$$;
create function public.create_film_club(club_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if char_length(trim(club_name)) not between 1 and 100 then raise exception 'Enter a club name'; end if;
 insert into public.clubs(name,created_by) values(trim(club_name),auth.uid()) returning id into new_id;
 insert into public.memberships(club_id,user_id) values(new_id,auth.uid());
 return new_id;
end; $$;
create function public.join_film_club(code uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare found_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select id into found_id from public.clubs where join_code=code;
 if found_id is null then raise exception 'Club code not found'; end if;
 insert into public.memberships(club_id,user_id) values(found_id,auth.uid()) on conflict do nothing;
 return found_id;
end; $$;
create function public.create_film_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,username) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'username'),60),''),'Film lover'));
 return new;
end; $$;
create trigger afterframe_auth_profile after insert on auth.users for each row execute function public.create_film_profile();
-- Profiles for any already-existing auth accounts; no email addresses are exposed.
insert into public.profiles(id,username) select id,coalesce(nullif(left(trim(raw_user_meta_data->>'username'),60),''),'Film lover') from auth.users on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.memberships enable row level security;
alter table public.reviews enable row level security;
alter table public.recommendations enable row level security;
alter table public.watchlist enable row level security;

create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or public.shares_club(id));
create policy profiles_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy clubs_read on public.clubs for select to authenticated using(public.is_club_member(id));
create policy clubs_update on public.clubs for update to authenticated using(created_by=(select auth.uid())) with check(created_by=(select auth.uid()));
create policy memberships_read on public.memberships for select to authenticated using(public.is_club_member(club_id));
create policy reviews_read on public.reviews for select to authenticated using(user_id=(select auth.uid()) or public.shares_club(user_id));
create policy reviews_insert on public.reviews for insert to authenticated with check(user_id=(select auth.uid()));
create policy reviews_update on public.reviews for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reviews_delete on public.reviews for delete to authenticated using(user_id=(select auth.uid()));
create policy recommendations_read on public.recommendations for select to authenticated using(public.is_club_member(club_id));
create policy recommendations_insert on public.recommendations for insert to authenticated with check(sender_id=(select auth.uid()) and public.receiver_in_club(club_id,receiver_id) and not is_read);
create policy recommendations_read_receipt on public.recommendations for update to authenticated using(receiver_id=(select auth.uid()) and public.is_club_member(club_id)) with check(receiver_id=(select auth.uid()) and public.is_club_member(club_id));
create policy watchlist_own on public.watchlist for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

revoke all on public.profiles,public.clubs,public.memberships,public.reviews,public.recommendations,public.watchlist from anon,authenticated;
grant select on public.profiles,public.clubs,public.memberships,public.reviews,public.recommendations,public.watchlist to authenticated;
grant update(username,avatar_url) on public.profiles to authenticated;
grant update(name) on public.clubs to authenticated;
grant insert,update,delete on public.reviews,public.watchlist to authenticated;
grant insert on public.recommendations to authenticated;
grant update(is_read) on public.recommendations to authenticated;
revoke all on function public.is_club_member(uuid), public.shares_club(uuid), public.receiver_in_club(uuid,uuid), public.create_film_club(text), public.join_film_club(uuid), public.create_film_profile() from public,anon;
grant execute on function public.is_club_member(uuid), public.shares_club(uuid), public.receiver_in_club(uuid,uuid), public.create_film_club(text), public.join_film_club(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
