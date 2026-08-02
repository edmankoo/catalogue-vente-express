# Configuration Web Push Notifications

## Étapes de configuration

### 1. Générer les clés VAPID

Les clés VAPID sont nécessaires pour signer les Web Push Notifications. Vous pouvez les générer avec le CLI Supabase ou web-push.

**Option A: Avec npm**
```bash
npm install -g web-push
web-push generate-vapid-keys
```

Vous obtiendrez:
```
Public Key: <YOUR_VAPID_PUBLIC_KEY>
Private Key: <YOUR_VAPID_PRIVATE_KEY>
```

**Option B: Avec un script Node**
```javascript
const vapidKeys = require('web-push').generateVAPIDKeys();
console.log('Public:', vapidKeys.publicKey);
console.log('Private:', vapidKeys.privateKey);
```

### 2. Configurer les variables d'environnement

**Dans `.env.local` (local dev):**
```
VITE_VAPID_PUBLIC_KEY=<YOUR_VAPID_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<YOUR_VAPID_PRIVATE_KEY>
```

**Dans Vercel (production):**
1. Allez sur vercel.com → Project Settings → Environment Variables
2. Ajoutez:
   - `VITE_VAPID_PUBLIC_KEY` (visible partout)
   - `VAPID_PRIVATE_KEY` (production only)

### 3. Déployer l'Edge Function

```bash
supabase functions deploy send-product-notifications --no-verify-jwt
```

### 4. Tester localement

```bash
npm run dev
```

- Allez sur le catalogue
- Cliquez sur "🔔 Recevoir les notifications"
- Acceptez la permission du navigateur
- Créez un nouveau produit depuis l'admin
- Vous devriez recevoir une notification

## Notes importantes

- Les Web Push Notifications nécessitent HTTPS (même localhost:5173 fonctionne)
- Le Service Worker doit être enregistré avant de demander la permission
- L'Edge Function a besoin d'un JWT ou doit être déployée avec `--no-verify-jwt`
- Les subscriptions expirent après 24h inactivité navigateur
