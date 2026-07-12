-- ============================================================
-- Catalogue Vente Express — détail client dans le dashboard admin
-- À coller en une fois dans : Dashboard Supabase > SQL Editor > Run
-- Ce script peut être relancé sans risque.
-- ============================================================

-- La jointure reservations -> users passait par PostgREST, qui applique
-- les policies RLS de "users" à chaque ligne jointe. Résultat : la ligne
-- du client n'était jamais renvoyée (silencieusement, sans erreur), même
-- pour un admin. Cette fonction fait la jointure côté base, une fois la
-- vérification d'admin faite, et contourne donc le problème.

drop function if exists public.get_admin_reservations();

create or replace function public.get_admin_reservations()
returns table (
  id uuid,
  product_id uuid,
  status text,
  reserved_at timestamptz,
  expires_at timestamptz,
  product_title text,
  client_first_name text,
  client_last_name text,
  client_phone text,
  client_email text
)
language sql
security definer
set search_path = public
as $$
  select
    r.id, r.product_id, r.status, r.reserved_at, r.expires_at,
    p.title,
    u.first_name, u.last_name, u.phone, u.email
  from public.reservations r
  join public.products p on p.id = r.product_id
  join public.users u on u.id = r.user_id
  where public.is_admin()
  order by r.reserved_at desc;
$$;

grant execute on function public.get_admin_reservations() to authenticated;
