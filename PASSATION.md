# Passation — Catalogue Vente Express

Ce document explique à qui appartient quoi, comment l'application est hébergée, et comment la faire vivre sans toucher au code.
**Il ne contient aucun mot de passe ni aucune clé secrète.** Les secrets restent dans Vercel, Supabase et le fichier `.env` local (jamais envoyé sur GitHub).

## 1. L'application en bref

PWA (site installable sur l'écran d'accueil) où un vendeur unique publie des produits que ses clients consultent et réservent.

- Les clients créent un compte (nom + téléphone obligatoires), réservent un produit et suivent leurs réservations.
- Une réservation bloque le produit **72 h**, puis elle expire automatiquement.
- Le vendeur (rôle ADMIN) gère produits, photos et réservations depuis le tableau de bord.
- Les clients abonnés reçoivent une notification push à chaque nouveau produit.

Site en production : https://catalogue-vente-express.vercel.app

## 2. Les trois services (et à qui ils doivent appartenir)

| Service | Rôle | Où |
|---|---|---|
| **GitHub** | Stocke le code source | dépôt `catalogue-vente-express` |
| **Vercel** | Héberge le site, redéploie à chaque mise à jour | projet `catalogue-vente-express` |
| **Supabase** | Base de données, comptes clients, photos, notifications | projet « Super Vente Express Aimeric » |

Tout est sur des offres gratuites. **Le propriétaire de chaque service doit être Aymeric** (voir section 6).

## 3. Variables et secrets (où sont-ils ?)

**Vercel → Settings → Environment Variables** (nécessaires au site) :

| Nom | Contenu |
|---|---|
| `VITE_SUPABASE_URL` | Adresse du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique Supabase (anon) |
| `VITE_VAPID_PUBLIC_KEY` | Clé publique des notifications push |

Ces variables sont lues **au moment du build** : après toute modification, il faut redéployer le site.

**Supabase → Edge Functions → Secrets** (nécessaires à l'envoi des notifications) :

| Nom | Contenu |
|---|---|
| `VAPID_PUBLIC_KEY` | Même clé publique que ci-dessus |
| `VAPID_PRIVATE_KEY` | Clé privée de signature des notifications |

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement par Supabase.

> **Ne jamais régénérer les clés VAPID.** Si elles changent, tous les abonnements aux notifications déjà enregistrés deviennent inutilisables et chaque client devra se réabonner.
> Conservez la clé privée dans un gestionnaire de mots de passe.

## 4. Utilisation quotidienne (sans code)

1. Se connecter sur le site avec le compte administrateur.
2. Ouvrir le **tableau de bord** (espace vendeur).
3. **Ajouter un produit** : titre, prix, rubrique, description, photos. Les abonnés reçoivent une notification.
4. **Réservations** : voir le nom et le téléphone du client, passer le statut à *Contacté* ou *Négociation*, puis *Valider* (le produit passe en Vendu) ou *Annuler* (il redevient disponible).
5. Une réservation non traitée expire seule après 72 h (vérification toutes les 15 minutes).

Règle : l'administrateur ne peut pas réserver ses propres produits. Il lui faut un compte client séparé pour tester.

**Installer l'app sur le téléphone** : Android → menu du navigateur → « Ajouter à l'écran d'accueil ». iPhone → Safari uniquement → bouton Partager → « Sur l'écran d'accueil ». Sur iPhone, les notifications ne fonctionnent que si l'app est installée de cette façon.

## 5. Points de vigilance

- **Supabase gratuit** : un projet sans aucune activité pendant environ une semaine peut être mis en pause. Il se réactive en un clic depuis le tableau de bord Supabase. Le plan Pro (environ 25 $/mois) supprime cette limite.
- **Confirmation d'email désactivée** (Supabase → Authentication → Providers → Email). C'est pratique mais permet des inscriptions avec de faux emails. À réactiver si l'usage grandit (prévoir alors un service d'envoi d'emails).
- **Données personnelles** : l'application stocke nom, téléphone et email des clients. Le propriétaire est responsable de ces données : prévoir une mention légale et une politique de confidentialité.
- **Nom de l'app** : « VenteExpress » est provisoire. Un nom de domaine propre (environ 10 € par an) se branche dans Vercel → Settings → Domains.

## 6. Procédure de transfert

Faire cette étape ensemble, à l'écran, une fois les comptes d'Aymeric créés (email de son choix, mot de passe fort + double authentification).

1. **Comptes** : Aymeric crée un compte GitHub, un compte Vercel et un compte Supabase (création d'une organisation).
2. **GitHub** : dépôt → Settings → Danger Zone → *Transfer ownership* vers son compte. Vérifier que le dépôt est **privé**.
3. **Supabase** : projet → Settings → General → *Transfer project* vers son organisation.
4. **Vercel** : projet → Settings → General → *Transfer Project* vers son compte. Puis reconnecter le projet au dépôt GitHub (Settings → Git) pour que chaque mise à jour du code redéploie le site. Contrôler les trois variables de la section 3.
5. **Compte administrateur** : Aymeric s'inscrit sur le site avec son email, puis son profil passe au rôle ADMIN (Supabase → SQL Editor) :
   ```sql
   update public.users set role = 'ADMIN' where email = 'email-d-aymeric@exemple.com';
   ```
   Ensuite, retirer le rôle ADMIN de l'ancien compte vendeur (`manmusicandco@gmail.com`) ou le supprimer.
6. **Vérification finale** (voir ci-dessous), puis retirer vos accès aux trois services.

### Checklist de vérification après transfert

- [ ] Le site s'ouvre et le catalogue s'affiche
- [ ] Création d'un compte client de test, puis réservation d'un produit
- [ ] La réservation apparaît dans le tableau de bord avec nom et téléphone
- [ ] Ajout d'un produit avec photo depuis le tableau de bord
- [ ] Une notification push arrive sur un téléphone abonné
- [ ] Les variables de la section 3 sont présentes sur Vercel et sur Supabase

## 7. Pour un développeur qui reprend le code

- Stack : React 19, Vite, TypeScript, Tailwind v4, Supabase, `vite-plugin-pwa`.
- Lancer en local : copier les variables de la section 3 dans un fichier `.env`, puis `npm install` et `npm run dev`. Compiler : `npm run build`.
- Base de données : les scripts de `supabase/` sont à exécuter dans l'ordre suivant : `schema.sql`, `storage.sql`, `expiration.sql`, `admin-reservations.sql`, `multiple-images.sql`, `multi-device-push.sql`.
  > **Danger : `schema.sql` supprime puis recrée les tables `users`, `products`, `reservations` et `push_subscriptions`. Le relancer sur la base de production efface toutes les données.** À n'utiliser que sur un projet Supabase vide (nouvelle installation). Pour faire évoluer la base existante, écrire des scripts de migration qui ne suppriment rien.
  > Les autres scripts de `supabase/` ne contiennent pas de `drop table`, mais lisez chacun avant de l'exécuter.
- La réservation passe uniquement par la fonction SQL `reserve_product()` (atomique). L'expiration passe par `pg_cron` (tâche `expire-reservations`, toutes les 15 min).
- Notifications : Edge Function `supabase/functions/send-product-notifications`. Elle utilise `jsr:@negrel/webpush` (WebCrypto). **Ne pas la remplacer par `npm:web-push`** : il fait planter le runtime Edge. Garder `deno.lock`.
- Déployer la fonction : `npx supabase functions deploy send-product-notifications --project-ref <ref-du-projet>`.
- Après une création de table dans Supabase, vérifier que les droits `execute` par défaut ne donnent pas accès à `anon` sur les nouvelles fonctions.
- `SETUP_WEB_PUSH.md` est un ancien guide : en cas de contradiction, ce document fait foi (la clé privée VAPID se met dans les secrets Supabase, pas dans Vercel).
