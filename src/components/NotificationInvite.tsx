import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import {
  checkNotificationSubscription,
  isPushSupported,
  needsIosInstall,
  PUSH_CHANGE_EVENT,
  subscribeToPushNotifications,
} from '../lib/pushNotifications'

const DISMISS_KEY = 'push-invite-dismissed'

// Le stockage peut être indisponible (navigation privée) : l'invitation
// réapparaîtra alors simplement à chaque visite.
function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    /* sans importance */
  }
}

/*
  Le bouton de l'en-tête n'est qu'une icône que personne ne remarque : sans
  invitation explicite, presque aucun client ne s'abonne. La bannière ne
  s'affiche qu'à un client connecté (l'abonnement est rattaché à un compte), qui
  n'est pas déjà abonné, n'a pas refusé la permission et ne l'a pas fermée.
*/
export default function NotificationInvite() {
  const { user, profile } = useAuth()
  const [subscribed, setSubscribed] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(wasDismissed)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supported = isPushSupported()
  const iosInstall = needsIosInstall()

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    const refresh = () => {
      checkNotificationSubscription().then((value) => {
        if (!cancelled) setSubscribed(value)
      })
    }
    refresh()
    window.addEventListener(PUSH_CHANGE_EVENT, refresh)
    return () => {
      cancelled = true
      window.removeEventListener(PUSH_CHANGE_EVENT, refresh)
    }
  }, [supported])

  if (!user || profile?.role === 'ADMIN' || dismissed) return null
  if (!supported && !iosInstall) return null
  if (supported && (subscribed === null || subscribed)) return null
  // Permission déjà refusée : redemander ne ferait que provoquer une erreur.
  if (supported && Notification.permission === 'denied') return null

  function dismiss() {
    rememberDismissal()
    setDismissed(true)
  }

  async function handleEnable() {
    setBusy(true)
    setError(null)
    try {
      await subscribeToPushNotifications()
      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'activation a échoué")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="region"
      aria-label="Notifications de nouveaux produits"
      className="mb-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3"
    >
      <span className="text-2xl" aria-hidden>
        🔔
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">Ne rate aucun nouvel article</p>
        {iosInstall ? (
          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
            Pour être prévenu à chaque nouveauté sur iPhone, installe l'app : touche{' '}
            <strong>Partager</strong> dans Safari, puis <strong>Sur l'écran d'accueil</strong>, et
            rouvre VenteExpress depuis l'icône.
          </p>
        ) : (
          <>
            <p className="mt-0.5 text-xs text-gray-600">
              Reçois une notification dès qu'un produit est publié, avant qu'il soit réservé.
            </p>
            <button
              onClick={handleEnable}
              disabled={busy}
              className="mt-2 rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
            >
              {busy ? 'Activation…' : 'Activer les notifications'}
            </button>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Fermer l'invitation"
        className="-mr-1 -mt-1 px-2 py-1 text-lg leading-none text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  )
}
