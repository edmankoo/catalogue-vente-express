import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import webpush from 'npm:web-push@3.6.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')

webpush.setVapidDetails('mailto:admin@catalogue-vente-express.com', vapidPublicKey!, vapidPrivateKey!)

interface PushSubscriptionRow {
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

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription')

    if (subError) {
      console.error('Erreur récupération subscriptions:', subError)
      return new Response(JSON.stringify({ error: subError.message }), { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 })
    }

    const notificationPayload = JSON.stringify({
      title: `📢 Nouveau produit : ${title}`,
      body: `Prix: ${price}€`,
      productId: product_id,
    })

    let sent = 0
    const staleUserIds: string[] = []

    for (const row of subscriptions as PushSubscriptionRow[]) {
      try {
        await webpush.sendNotification(row.subscription, notificationPayload)
        sent++
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode
        console.warn(`Échec d'envoi (user ${row.user_id}):`, statusCode, error)
        // 404/410 = abonnement expiré ou révoqué côté navigateur : à nettoyer
        if (statusCode === 404 || statusCode === 410) {
          staleUserIds.push(row.user_id)
        }
      }
    }

    if (staleUserIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('user_id', staleUserIds)
    }

    return new Response(JSON.stringify({ sent, total: subscriptions.length }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
