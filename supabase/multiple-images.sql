-- ============================================================
-- Catalogue Vente Express — Plusieurs photos par produit
-- À coller en une fois dans : Dashboard Supabase > SQL Editor > Run
-- Sûr à relancer, ne touche pas aux données existantes.
-- ============================================================

alter table public.products add column if not exists image_urls text[] not null default '{}';

-- Reprend l'unique photo déjà en place comme première image de la galerie.
update public.products
set image_urls = array[image_url]
where image_url is not null and image_urls = '{}';
