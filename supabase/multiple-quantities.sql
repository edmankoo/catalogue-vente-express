-- ============================================================
-- Catalogue Vente Express — produits en lot (plusieurs clients possibles)
-- À coller en une fois dans : Dashboard Supabase > SQL Editor > Run
-- Ce script peut être relancé sans risque (aucune table supprimée).
--
-- Principe :
--   * products.is_multiple  : le vendeur indique si le produit est un lot.
--   * products.stock        : nombre d'unités pas encore vendues.
--   * products.reserved_quantity : unités actuellement réservées (calculé).
--   * reservations.quantity : nombre d'unités prises par la réservation.
--   Disponible = stock - reserved_quantity (lot) ; produit unique = 1 seule
--   réservation à la fois, comme avant.
--   Statut du produit : Vendu si stock = 0, Réservé si plus rien de libre,
--   sinon Disponible. Il est recalculé par refresh_product_availability().
--
-- Ce script remplace reserve_product() et expire_old_reservations() de
-- expiration.sql : ne PAS relancer ces deux définitions après lui.
-- La planification pg_cron (expire-reservations) reste valable.
-- ============================================================

-- ---------- Colonnes ----------
alter table public.products
  add column if not exists is_multiple boolean not null default false;

alter table public.products
  add column if not exists reserved_quantity integer not null default 0
  check (reserved_quantity >= 0);

alter table public.reservations
  add column if not exists quantity integer not null default 1
  check (quantity > 0);

-- Avant ce script, « Vendu » ne touchait pas au stock. Le stock devient
-- le nombre d'unités restantes : un produit déjà vendu passe à 0.
update public.products set stock = 0 where status = 'SOLD' and stock > 0;

-- ---------- Recalcul du statut d'un produit ----------
create or replace function public.refresh_product_availability(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_reserved integer;
  v_available integer;
  v_status text;
begin
  select * into v_product from public.products where id = p_product_id for update;
  if not found or v_product.status = 'ARCHIVED' then
    return;
  end if;

  select coalesce(sum(quantity), 0) into v_reserved
  from public.reservations
  where product_id = p_product_id
    and status in ('NEW', 'CONTACTED', 'NEGOTIATION');

  v_available := case
    when v_product.is_multiple then v_product.stock - v_reserved
    when v_reserved > 0 then 0
    else v_product.stock
  end;

  v_status := case
    when v_product.stock <= 0 then 'SOLD'
    when v_available <= 0 then 'RESERVED'
    else 'AVAILABLE'
  end;

  update public.products
  set reserved_quantity = v_reserved, status = v_status, updated_at = now()
  where id = p_product_id;
end;
$$;

revoke all on function public.refresh_product_availability(uuid) from public, anon, authenticated;

-- Quand le vendeur modifie le stock ou l'option « lot » depuis le dashboard,
-- le statut suit automatiquement. (Le recalcul ne touche ni stock ni
-- is_multiple : pas de boucle.)
create or replace function public.on_product_stock_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_product_availability(new.id);
  return null;
end;
$$;

drop trigger if exists products_refresh_availability on public.products;
create trigger products_refresh_availability
  after update of stock, is_multiple on public.products
  for each row execute function public.on_product_stock_changed();

-- ---------- Réservation atomique avec quantité ----------
drop function if exists public.reserve_product(uuid);
drop function if exists public.reserve_product(uuid, integer);

create or replace function public.reserve_product(p_product_id uuid, p_quantity integer default 1)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
  v_user_id uuid;
  v_product public.products;
  v_quantity integer;
begin
  if public.is_admin() then
    raise exception 'ADMIN_CANNOT_RESERVE';
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- Ensure user profile exists (in case signup trigger failed)
  insert into public.users (id, email)
  select auth.uid(), email from auth.users where id = v_user_id
  on conflict (id) do nothing;

  select * into v_product from public.products where id = p_product_id for update;
  if not found or v_product.status <> 'AVAILABLE' then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  if v_product.is_multiple then
    v_quantity := coalesce(p_quantity, 1);
    if v_quantity < 1 then
      raise exception 'INVALID_QUANTITY';
    end if;
    if v_quantity > v_product.stock - v_product.reserved_quantity then
      raise exception 'QUANTITY_NOT_AVAILABLE';
    end if;
  else
    v_quantity := 1;
  end if;

  insert into public.reservations (product_id, user_id, quantity)
  values (p_product_id, v_user_id, v_quantity)
  returning * into v_reservation;

  perform public.refresh_product_availability(p_product_id);

  return v_reservation;
end;
$$;

revoke all on function public.reserve_product(uuid, integer) from public, anon;
grant execute on function public.reserve_product(uuid, integer) to authenticated;

-- Les réservations ne passent que par la fonction ci-dessus.
revoke insert on public.reservations from authenticated;

-- ---------- Validation / annulation par le vendeur ----------
create or replace function public.confirm_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res public.reservations;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found or v_res.status not in ('NEW', 'CONTACTED', 'NEGOTIATION') then
    raise exception 'RESERVATION_NOT_PENDING';
  end if;

  update public.reservations set status = 'CONFIRMED' where id = p_reservation_id;

  -- Les unités vendues sortent définitivement du stock (un produit unique
  -- passe à 0, donc « Vendu »).
  update public.products
  set stock = case
    when is_multiple then greatest(stock - v_res.quantity, 0)
    else 0
  end
  where id = v_res.product_id;

  perform public.refresh_product_availability(v_res.product_id);
end;
$$;

create or replace function public.cancel_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res public.reservations;
begin
  if not public.is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_res from public.reservations where id = p_reservation_id for update;
  if not found or v_res.status not in ('NEW', 'CONTACTED', 'NEGOTIATION') then
    raise exception 'RESERVATION_NOT_PENDING';
  end if;

  update public.reservations set status = 'CANCELLED' where id = p_reservation_id;

  perform public.refresh_product_availability(v_res.product_id);
end;
$$;

revoke all on function public.confirm_reservation(uuid) from public, anon;
revoke all on function public.cancel_reservation(uuid) from public, anon;
grant execute on function public.confirm_reservation(uuid) to authenticated;
grant execute on function public.cancel_reservation(uuid) to authenticated;

-- ---------- Expiration automatique après 72h ----------
create or replace function public.expire_old_reservations()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
begin
  for v_product_id in
    with expired as (
      update public.reservations
      set status = 'EXPIRED'
      where status in ('NEW', 'CONTACTED', 'NEGOTIATION') and expires_at < now()
      returning product_id
    )
    select distinct product_id from expired
  loop
    perform public.refresh_product_availability(v_product_id);
  end loop;
end;
$$;

-- ---------- Détail client du dashboard : ajoute la quantité ----------
drop function if exists public.get_admin_reservations();

create or replace function public.get_admin_reservations()
returns table (
  id uuid,
  product_id uuid,
  status text,
  quantity integer,
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
    r.id, r.product_id, r.status, r.quantity, r.reserved_at, r.expires_at,
    p.title,
    u.first_name, u.last_name, u.phone, u.email
  from public.reservations r
  join public.products p on p.id = r.product_id
  join public.users u on u.id = r.user_id
  where public.is_admin()
  order by r.reserved_at desc;
$$;

revoke all on function public.get_admin_reservations() from public, anon;
grant execute on function public.get_admin_reservations() to authenticated;

-- ---------- Remise en cohérence des produits existants ----------
select public.refresh_product_availability(id)
from public.products
where status <> 'ARCHIVED';
