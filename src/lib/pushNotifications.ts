import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

const SW_READY_TIMEOUT_MS = 5000

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function isIos() {
  // iPadOS 13+ s'annonce comme un Mac : le tactile est ce qui l'en distingue.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari iOS n'implémente toujours pas display-mode, d'où ce reliquat.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/*
  iOS n'expose PushManager que dans une PWA installée. Tant que l'app tourne dans
  un onglet Safari, aucune inscription n'est possible : il faut d'abord l'ajouter
  à l'écran d'accueil, ce que rien n'indique à l'utilisateur.
*/
export function needsIosInstall() {
  return !isPushSupported() && isIos() && !isStandalone()
}

/*
  `navigator.serviceWorker.ready` ne se résout JAMAIS tant qu'aucun service worker
  n'est enregistré — en dev, ou sur iPhone en navigation privée où iOS les désactive.
  Sans cette borne, tout appelant reste bloqué indéfiniment.
*/
async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)
  })

  try {
    return await Promise.race([navigator.serviceWorker.ready, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    throw new Error('Push Notifications non supportées')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permission de notification refusée')
  }

  const registration = await getReadyRegistration()
  if (!registration) {
    throw new Error('Service Worker indisponible')
  }

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

    /*
      Passe par une fonction SECURITY DEFINER plutôt qu'un upsert direct :
      l'unicité porte sur l'endpoint, et cet endpoint peut déjà appartenir à un
      autre compte (même téléphone, utilisateur précédent). Les policies RLS
      empêcheraient de reprendre la ligne, la fonction s'en charge.
    */
    const { error } = await supabase.rpc('upsert_push_subscription', {
      p_subscription: subscription.toJSON(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erreur inscription notifications:', error)
    throw error
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await getReadyRegistration()
    const subscription = await registration?.pushManager.getSubscription()

    // Lu AVANT unsubscribe() : l'objet ne porte plus son endpoint ensuite.
    const endpoint = subscription?.endpoint

    if (subscription) {
      await subscription.unsubscribe()
    }

    const { data } = await supabase.auth.getUser()
    // Plus de session : l'abonnement navigateur est révoqué, rien à supprimer côté serveur.
    if (!data.user) return true

    /*
      Suppression ciblée sur cet appareil : filtrer par user_id supprimerait
      aussi les abonnements des autres appareils du compte. Sans endpoint (aucun
      abonnement navigateur en place), il n'y a rien à cibler — une éventuelle
      ligne résiduelle sera nettoyée par l'Edge Function au premier 404/410.
    */
    if (endpoint) {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint)
      if (error) throw error
    }

    return true
  } catch (error) {
    console.error('Erreur désinscription notifications:', error)
    throw error
  }
}

export async function checkNotificationSubscription(): Promise<boolean> {
  try {
    if (!isPushSupported()) return false

    const registration = await getReadyRegistration()
    if (!registration) return false

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
