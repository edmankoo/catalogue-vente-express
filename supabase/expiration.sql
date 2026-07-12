-- ============================================================
-- Catalogue Vente Express — réservation atomique + expiration auto 72h
-- À coller en une fois dans : Dashboard Supabase > SQL Editor > Run
-- Ce script peut être relancé sans risque.
-- ============================================================

-- ---------- Nettoyage ----------
do $$
begin
  if exists (select 1 from cron.job where jobname = 'expire-reservations') then
    perform cron.unschedule('expire-reservations');
  end if;
exception when undefined_table then
  null; -- pg_cron pas encore activé, rien à nettoyer
end $$;

drop function if exists public.reserve_product(uuid);
drop function if exists public.expire_old_reservations();

-- ---------- Réservation atomique ----------
-- Vérifie la dispo, crée la réservation et passe le produit en RESERVED
-- dans une seule transaction verrouillée : deux clients ne peuvent pas
-- réserver le même article en même temps.
create or replace function public.reserve_product(p_product_id uuid)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
begin
  if public.is_admin() then
    raise exception 'ADMIN_CANNOT_RESERVE';
  end if;

  perform 1 from public.products where id = p_product_id and status = 'AVAILABLE' for update;
  if not found then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  insert into public.reservations (product_id, user_id)
  values (p_product_id, auth.uid())
  returning * into v_reservation;

  update public.products set status = 'RESERVED', updated_at = now() where id = p_product_id;

  return v_reservation;
end;
$$;

grant execute on function public.reserve_product(uuid) to authenticated;

-- Les réservations ne passent plus que par la fonction ci-dessus
-- (empêche un insert direct qui contournerait la vérification de dispo).
revoke insert on public.reservations from authenticated;

-- ---------- Expiration automatique après 72h ----------
create or replace function public.expire_old_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set status = 'AVAILABLE', updated_at = now()
  where status = 'RESERVED'
    and id in (
      select product_id from public.reservations
      where status in ('NEW', 'CONTACTED', 'NEGOTIATION') and expires_at < now()
    );

  update public.reservations
  set status = 'EXPIRED'
  where status in ('NEW', 'CONTACTED', 'NEGOTIATION') and expires_at < now();
end;
$$;

-- ---------- Planification (toutes les 15 minutes) ----------
create extension if not exists pg_cron with schema extensions;

select cron.schedule('expire-reservations', '*/15 * * * *', $$select public.expire_old_reservations();$$);
