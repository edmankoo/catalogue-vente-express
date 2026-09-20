-- ============================================================
-- Catalogue Vente Express — schéma initial
-- À coller en une fois dans : Dashboard Supabase > SQL Editor > Run
-- Ce script peut être relancé sans risque (il nettoie d'abord tout
-- ce qu'un essai précédent aurait pu créer).
-- ============================================================

-- ---------- Nettoyage (sûr même si rien n'existe encore) ----------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.push_subscriptions cascade;
drop table if exists public.reservations cascade;
drop table if exists public.products cascade;
drop function if exists public.is_admin() cascade;
drop table if exists public.users cascade;

create extension if not exists "pgcrypto";

-- ---------- USERS ----------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  role text not null default 'CLIENT' check (role in ('ADMIN', 'CLIENT')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- SECURITY DEFINER pour éviter la récursion RLS (une policy sur "users" qui
-- interroge "users" boucle sinon)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'ADMIN'
  );
$$;

create policy "users_select_own_or_admin" on public.users
  for select using (auth.uid() = id or public.is_admin());

create policy "users_update_own_or_admin" on public.users
  for update using (auth.uid() = id or public.is_admin());

-- ---------- PRODUCTS ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price numeric(10, 2) not null default 0,
  stock integer not null default 1,
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED')),
  category text not null default 'autres',
  image_url text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_select_all" on public.products
  for select using (true);

create policy "products_write_admin" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- RESERVATIONS ----------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'NEW' check (status in ('NEW', 'CONTACTED', 'NEGOTIATION', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '72 hours'),
  admin_notes text
);

alter table public.reservations enable row level security;

create policy "reservations_select_own_or_admin" on public.reservations
  for select using (auth.uid() = user_id or public.is_admin());

create policy "reservations_insert_own" on public.reservations
  for insert with check (auth.uid() = user_id);

create policy "reservations_update_admin" on public.reservations
  for update using (public.is_admin());

-- ---------- PUSH SUBSCRIPTIONS ----------
-- L'unicité porte sur l'endpoint, pas sur l'utilisateur : un même compte
-- consulté depuis un iPhone et depuis un ordinateur produit deux endpoints
-- distincts, donc deux abonnements à conserver côte à côte.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subscription jsonb not null,
  -- Colonne générée : ne peut pas se désynchroniser du jsonb.
  endpoint text generated always as (subscription ->> 'endpoint') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create index push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

-- Le réabonnement d'un appareil déjà connu se résout en UPDATE : sans cette
-- policy, il échouerait sur l'index unique de l'endpoint.
create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Un même appareil peut changer de compte : déconnexion, puis connexion d'un
-- autre utilisateur sur le même téléphone. La ligne portant cet endpoint
-- appartient alors à quelqu'un d'autre, et les policies ci-dessus interdisent
-- au nouvel arrivant de la reprendre — l'upsert échouerait sur l'index unique.
-- SECURITY DEFINER autorise ce transfert, strictement limité à l'endpoint que
-- le navigateur vient de fournir.
create or replace function public.upsert_push_subscription(p_subscription jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  if p_subscription ->> 'endpoint' is null then
    raise exception 'Abonnement sans endpoint';
  end if;

  insert into public.push_subscriptions (user_id, subscription)
  values (auth.uid(), p_subscription)
  on conflict (endpoint) do update
    set user_id      = excluded.user_id,
        subscription = excluded.subscription,
        updated_at   = now();
end;
$$;

-- `anon` explicitement : les privilèges par défaut du schéma public lui
-- accordent l'exécution à la création, que le revoke sur PUBLIC ne retire pas.
revoke all on function public.upsert_push_subscription(jsonb) from public, anon;
grant execute on function public.upsert_push_subscription(jsonb) to authenticated;

-- ---------- Grants (Supabase applique ensuite les policies RLS ci-dessus) ----------
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, update on public.users to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update on public.reservations to authenticated;

-- ---------- Trigger : crée automatiquement le profil "users" à l'inscription ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'phone',
    'CLIENT'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Seed : les produits de démo actuels du catalogue ----------
insert into public.products (title, description, price, stock, status, category, image_url, created_at) values
('iPhone 13 Pro — 256 Go', 'Très bon état, batterie 89%, avec chargeur et boîte d''origine.', 550, 1, 'AVAILABLE', 'electronique', 'https://placehold.co/400x300/e8f0fe/4285f4?text=iPhone+13+Pro', '2026-06-10'),
('Canapé 3 places tissu gris', 'Canapé confortable, quelques traces d''usure, très bon confort.', 180, 1, 'RESERVED', 'maison', 'https://placehold.co/400x300/f3e8ff/9333ea?text=Canape+gris', '2026-06-08'),
('Veste en cuir noir — Taille M', 'Veste en cuir synthétique, peu portée, taille M.', 65, 2, 'AVAILABLE', 'vetements', 'https://placehold.co/400x300/fef3c7/d97706?text=Veste+cuir', '2026-06-12'),
('Perceuse Bosch sans fil', '18V, 2 batteries, chargeur inclus. Très bon état.', 85, 1, 'AVAILABLE', 'outillage', 'https://placehold.co/400x300/dcfce7/16a34a?text=Perceuse+Bosch', '2026-06-05'),
('Machine à café Nespresso', 'Fonctionne parfaitement, détartrée récemment.', 45, 0, 'SOLD', 'petit-electromenager', 'https://placehold.co/400x300/fee2e2/dc2626?text=Nespresso', '2026-06-01'),
('Vélo de route 54cm — Shimano', 'Cadre aluminium, 21 vitesses, très bon état général.', 320, 1, 'AVAILABLE', 'sport', 'https://placehold.co/400x300/e0f2fe/0284c7?text=Velo+route', '2026-06-14'),
('MacBook Air M1 — 8 Go / 256 Go', 'Excellent état, batterie 95%, chargeur inclus.', 750, 1, 'AVAILABLE', 'informatique', 'https://placehold.co/400x300/f0fdf4/22c55e?text=MacBook+Air', '2026-06-13'),
('LEGO Technic — Camion 42128', 'Complet, boîte d''origine en bon état.', 55, 3, 'AVAILABLE', 'jouets', 'https://placehold.co/400x300/fff7ed/ea580c?text=LEGO+Technic', '2026-06-11'),
('Lave-linge Samsung 8kg', '3 ans, fonctionne parfaitement, moteur brushless.', 230, 1, 'RESERVED', 'electromenager', 'https://placehold.co/400x300/f8fafc/64748b?text=Lave-linge', '2026-06-07'),
('Jantes alu 205/55 R16 — x4', '4 jantes avec pneus hiver, bon état, sans crevaison.', 140, 1, 'AVAILABLE', 'auto', 'https://placehold.co/400x300/fafaf9/737373?text=Jantes+alu', '2026-06-09'),
('Service vaisselle 12 pièces', 'Blanc, quelques légères rayures, complet.', 30, 1, 'AVAILABLE', 'maison', 'https://placehold.co/400x300/fdf4ff/c026d3?text=Vaisselle', '2026-06-06'),
('Sneakers Nike Air Max 90 — 42', 'Portées 3 fois, comme neuves, taille 42.', 70, 1, 'AVAILABLE', 'vetements', 'https://placehold.co/400x300/eff6ff/3b82f6?text=Nike+Air+Max', '2026-06-15');

-- ============================================================
-- ÉTAPE SUIVANTE (à faire APRÈS avoir lancé le script ci-dessus) :
-- 1. Inscris-toi une fois via l'app (onglet Inscription du catalogue).
-- 2. Reviens ici et lance CETTE ligne séparément, avec ton propre email,
--    pour transformer ton compte en administrateur :
--
-- update public.users set role = 'ADMIN' where email = 'ton-email@exemple.com';
-- ============================================================
