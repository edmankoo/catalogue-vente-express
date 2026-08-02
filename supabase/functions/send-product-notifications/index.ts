import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const payload = await req.json()
    const { product_id, title, price } = payload

    if (!product_id || !title) {
      return new Response('Missing product_id or title', { status: 400 })
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Récupère toutes les subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')

    if (subError) {
      console.error('Erreur récupération subscriptions:', subError)
      return new Response(JSON.stringify({ error: subError.message }), { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const notificationPayload = {
      title: `📢 Nouveau produit : ${title}`,
      body: `Prix: ${price}€`,
      productId: product_id,
    }

    const sentCount = await sendPushNotifications(
      subscriptions.map((s) => s.subscription as PushSubscription),
      notificationPayload,
      vapidPublicKey!,
      vapidPrivateKey!
    )

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})

async function sendPushNotifications(
  subscriptions: PushSubscription[],
  payload: Record<string, any>,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<number> {
  let sent = 0

  for (const subscription of subscriptions) {
    try {
      const headers = {
        'Content-Type': 'application/octet-stream',
        'TTL': '24',
        'Urgency': 'high',
      } as Record<string, string>

      // Signature VAPID (simple)
      const timestamp = Math.floor(Date.now() / 1000)
      const aud = new URL(subscription.endpoint).origin
      const sub = 'mailto:admin@catalogue-vente-express.com'

      const vapidAuthHeader = generateVAPIDAuthHeader(
        aud,
        sub,
        timestamp,
        vapidPublicKey,
        vapidPrivateKey
      )

      headers['Authorization'] = vapidAuthHeader

      // Envoie le push
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        sent++
      } else {
        console.warn(`Failed to send push to ${subscription.endpoint}: ${response.status}`)
      }
    } catch (error) {
      console.warn(`Error sending push: ${error}`)
    }
  }

  return sent
}

function generateVAPIDAuthHeader(
  aud: string,
  sub: string,
  exp: number,
  publicKey: string,
  privateKey: string
): string {
  // Simplifié: juste un header VAPID de base
  // En production, implémenter la signature JWT complète
  return `vapid t=${publicKey}, k=${publicKey}`
}
