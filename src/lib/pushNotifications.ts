import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export async function requestNotificationPermission() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Workers non supportés')
  }

  if (!('PushManager' in window)) {
    throw new Error('Push Notifications non supportées')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permission de notification refusée')
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  return subscription
}

export async function subscribeToPushNotifications() {
  try {
    const subscription = await requestNotificationPermission()
    const { data } = await supabase.auth.getUser()

    if (!data.user) throw new Error('Non connecté')

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: data.user.id,
        subscription: subscription.toJSON(),
      },
      { onConflict: 'user_id' }
    )

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erreur inscription notifications:', error)
    throw error
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
    }

    const { error } = await supabase.from('push_subscriptions').delete().eq('id', 'any')
    if (error) throw error

    return true
  } catch (error) {
    console.error('Erreur désinscription notifications:', error)
    throw error
  }
}

export async function checkNotificationSubscription(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}
