import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as webpush from 'jsr:@negrel/webpush@0.3.0'

/*
  web-push (npm) tire des modules Node — https, https-proxy-agent, asn1.js — que
  l'Edge Runtime n'expose pas : son import tuait le worker au démarrage, donc
  TOUTES les requêtes répondaient 500 WORKER_ERROR. On passe par une
  implémentation 100 % WebCrypto, native Deno.
*/

const CONTACT = 'mailto:admin@catalogue-vente-express.com'

function b64urlToBytes(value: string): Uint8Array {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
}

function bytesToB64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/*
  Les clés VAPID sont stockées au format brut base64url (65 octets pour la clé
  publique : 0x04 + X + Y, 32 pour la privée), alors que WebCrypto n'importe que
  du JWK.
*/
function vapidJwkFromRawKeys(publicKey: string, privateKey: string) {
  const pub = b64urlToBytes(publicKey)
  const priv = b64urlToBytes(privateKey)

  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error(`VAPID_PUBLIC_KEY invalide (${pub.length} octets, attendu 65)`)
  }
  if (priv.length !== 32) {
    throw new Error(`VAPID_PRIVATE_KEY invalide (${priv.length} octets, attendu 32)`)
  }

  const x = bytesToB64url(pub.slice(1, 33))
  const y = bytesToB64url(pub.slice(33, 65))

  return {
    publicKey: { kty: 'EC', crv: 'P-256', ext: true, key_ops: ['verify'], x, y },
    privateKey: {
      kty: 'EC',
      crv: 'P-256',
      ext: true,
      key_ops: ['sign'],
      x,
      y,
      d: bytesToB64url(priv),
    },
  }
}

/*
  Initialisation paresseuse : au niveau module, une variable d'environnement
  absente ferait sortir le worker avant même d'atteindre le handler, et le seul
  symptôme visible serait un 500 opaque. Ici l'erreur remonte dans la réponse.
*/
let applicationServer: Promise<webpush.ApplicationServer> | null = null

function getApplicationServer() {
  if (!applicationServer) {
    applicationServer = (async () => {
      const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
      const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')

      if (!publicKey || !privateKey) {
        throw new Error(
          `Secrets VAPID manquants (public: ${!!publicKey}, privé: ${!!privateKey})`
        )
      }

      const vapidKeys = await webpush.importVapidKeys(
        vapidJwkFromRawKeys(publicKey, privateKey) as never,
        { extractable: false }
      )

      return await webpush.ApplicationServer.new({
        contactInformation: CONTACT,
        vapidKeys,
      })
    })().catch((error) => {
      // Sans ce reset, un échec transitoire resterait mémorisé pour toujours.
      applicationServer = null
      throw error
    })
  }

  return applicationServer
}

interface PushSubscriptionRow {
  id: string
  user_id: string
  subscription: {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { product_id, title, price } = await req.json()

    if (!product_id || !title) {
      return new Response('Missing product_id or title', { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, subscription')

    if (subError) {
      console.error('Erreur récupération subscriptions:', subError)
      return new Response(JSON.stringify({ error: subError.message }), { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, total: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const server = await getApplicationServer()

    const notificationPayload = JSON.stringify({
      title: `📢 Nouveau produit : ${title}`,
      body: `Prix: ${price}€`,
      productId: product_id,
    })

    let sent = 0
    // Par ligne et non par utilisateur : un compte a désormais un abonnement par
    // appareil, et l'expiration de l'un ne dit rien des autres.
    const staleIds: string[] = []

    for (const row of subscriptions as PushSubscriptionRow[]) {
      try {
        const subscriber = server.subscribe(row.subscription as never)
        await subscriber.pushTextMessage(notificationPayload, {})
        sent++
      } catch (error) {
        const status = (error as { response?: Response }).response?.status
        console.warn(`Échec d'envoi (user ${row.user_id}):`, status, error)
        // 404/410 = abonnement expiré ou révoqué côté navigateur : à nettoyer
        if (status === 404 || status === 410) {
          staleIds.push(row.id)
        }
      }
    }

    if (staleIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds)
    }

    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
