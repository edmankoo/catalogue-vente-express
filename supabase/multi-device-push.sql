-- ============================================================
-- Catalogue Vente Express — Plusieurs appareils par utilisateur
-- À coller en une fois dans : Dashboard Supabase > SQL Editor > Run
-- Sûr à relancer, ne supprime aucun abonnement valide.
-- ============================================================

-- L'identité d'un abonnement push, c'est son endpoint : une URL opaque propre
-- au couple navigateur + appareil. Un même compte consulté depuis un iPhone et
-- depuis un ordinateur produit deux endpoints distincts. unique(user_id)
-- faisait que le second abonnement écrasait silencieusement le premier.
alter table public.push_subscriptions
  drop constraint if exists push_subscriptions_user_id_key;

-- Colonne générée plutôt que colonne ordinaire : elle ne peut pas se
-- désynchroniser du jsonb, y compris si `subscription` est mis à jour seul.
alter table public.push_subscriptions
  add column if not exists endpoint text
  generated always as (subscription ->> 'endpoint') stored;

-- Dédoublonnage préalable : deux lignes peuvent déjà porter le même endpoint
-- (même appareil réabonné sous un autre compte), ce qui ferait échouer la
-- création de l'index. On conserve la plus récente.
delete from public.push_subscriptions a
using public.push_subscriptions b
where a.endpoint = b.endpoint
  and (a.updated_at, a.id) < (b.updated_at, b.id);

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

-- L'Edge Function lit tous les abonnements, mais l'app filtre par utilisateur.
create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- ---------- Enregistrement d'un abonnement ----------
-- Un même appareil peut changer de compte : déconnexion, puis connexion d'un
-- autre utilisateur sur le même téléphone. La ligne portant cet endpoint
-- appartient alors à quelqu'un d'autre, et les policies RLS « chacun ses
-- lignes » interdisent au nouvel arrivant de la reprendre — l'upsert échouerait
-- sur l'index unique. SECURITY DEFINER autorise ce transfert, strictement
-- limité à l'endpoint que le navigateur vient de fournir.
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

-- `anon` est révoqué explicitement : les privilèges par défaut de Supabase sur
-- le schéma public lui accordent l'exécution à la création, que le revoke sur
-- PUBLIC ne retire pas. La fonction refuserait de toute façon sans session,
-- mais autant que les droits disent ce qu'on veut.
revoke all on function public.upsert_push_subscription(jsonb) from public, anon;
grant execute on function public.upsert_push_subscription(jsonb) to authenticated;
