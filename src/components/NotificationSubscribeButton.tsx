import { useEffect, useState } from 'react'
import {
  checkNotificationSubscription,
  isPushSupported,
  needsIosInstall,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/pushNotifications'

const BUTTON_BASE =
  'px-2 sm:px-3 py-2 text-sm rounded-lg font-medium transition-colors whitespace-nowrap'

export default function NotificationSubscribeButton() {
  // Sur iPhone, PushManager n'existe que si l'app est installée sur l'écran
  // d'accueil : ailleurs le bouton ne pourrait que renvoyer une erreur.
  const [supported] = useState(isPushSupported)
  const [showIosHint, setShowIosHint] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(supported)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supported) return

    let cancelled = false

    const checkSubscription = async () => {
      try {
        const subscribed = await checkNotificationSubscription()
        if (!cancelled) setIsSubscribed(subscribed)
      } catch {
        if (!cancelled) setIsSubscribed(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    checkSubscription()

    return () => {
      cancelled = true
    }
  }, [supported])

  const handleToggle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (isSubscribed) {
        await unsubscribeFromPushNotifications()
        setIsSubscribed(false)
      } else {
        await subscribeToPushNotifications()
        setIsSubscribed(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (!supported) {
    // Hors iPhone non installé, il n'y a rien à proposer ni à expliquer.
    if (!needsIosInstall()) return null

    return (
      <div className="relative">
        <button
          onClick={() => setShowIosHint((shown) => !shown)}
          aria-expanded={showIosHint}
          title="Recevoir les notifications"
          className={`${BUTTON_BASE} bg-blue-100 text-blue-700 hover:bg-blue-200`}
        >
          <span aria-hidden>🔔</span>
          <span className="hidden sm:inline sm:ml-1">Recevoir les notifications</span>
        </button>
        {showIosHint && (
          <p className="absolute right-0 top-full mt-1 z-10 w-60 max-w-[75vw] rounded-lg bg-white px-3 py-2 text-xs leading-relaxed text-gray-600 shadow-lg">
            Sur iPhone, les notifications demandent d'installer l'app : touche{' '}
            <span aria-hidden>⬆️</span> <strong>Partager</strong> dans Safari, puis{' '}
            <strong>Sur l'écran d'accueil</strong>. Rouvre ensuite VenteExpress depuis
            l'icône.
          </p>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`${BUTTON_BASE} bg-gray-200 text-gray-600 cursor-not-allowed`}
      >
        <span aria-hidden>⏳</span>
        <span className="hidden sm:inline sm:ml-1">Chargement...</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        title={isSubscribed ? 'Notifications activées' : 'Recevoir les notifications'}
        className={`${BUTTON_BASE} ${
          isSubscribed
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
      >
        <span aria-hidden>{isSubscribed ? '✓' : '🔔'}</span>
        <span className="hidden sm:inline sm:ml-1">
          {isSubscribed ? 'Notifications activées' : 'Recevoir les notifications'}
        </span>
      </button>
      {error && (
        <p className="absolute right-0 top-full mt-1 z-10 max-w-[70vw] rounded-lg bg-white px-2 py-1 text-xs text-red-600 shadow">
          {error}
        </p>
      )}
    </div>
  )
}
