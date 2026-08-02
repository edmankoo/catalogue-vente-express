import { useEffect, useState } from 'react'
import { checkNotificationSubscription, subscribeToPushNotifications } from '../lib/pushNotifications'

export default function NotificationSubscribeButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const subscribed = await checkNotificationSubscription()
        setIsSubscribed(subscribed)
      } catch {
        setIsSubscribed(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSubscription()
  }, [])

  const handleToggle = async () => {
    if (isSubscribed) {
      // TODO: implémenter la désinscription
      setIsSubscribed(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await subscribeToPushNotifications()
      setIsSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <button disabled className="px-3 py-2 text-sm bg-gray-200 text-gray-600 rounded-lg cursor-not-allowed">
        Chargement...
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleToggle}
        className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
          isSubscribed
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        }`}
      >
        {isSubscribed ? '✓ Notifications activées' : '🔔 Recevoir les notifications'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
