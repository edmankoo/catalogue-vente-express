import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../../lib/supabaseClient'

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Le clic sur le lien de récupération déclenche cet événement et ouvre
    // une session temporaire, sans avoir besoin de connaître l'ancien mot de passe.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Filet de sécurité : si l'événement a déjà été émis avant le montage du composant.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = password.trim()

    if (trimmed.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (trimmed !== passwordConfirm.trim()) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(trimmed)
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏷️</span>
        <span className="font-bold text-gray-900 text-lg leading-none">
          Vente<span className="text-orange-500">Express</span>
        </span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-5">
        {done ? (
          <div className="text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold text-gray-800">Mot de passe mis à jour !</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              Retour au catalogue
            </button>
          </div>
        ) : !ready ? (
          <p className="text-sm text-gray-500 text-center">
            Lien invalide ou expiré. Redemande une réinitialisation depuis la page de connexion.
          </p>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <h1 className="font-semibold text-gray-800 text-center mb-1">Nouveau mot de passe</h1>

            <div>
              <label className="text-xs font-medium text-gray-500">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60"
            >
              {loading ? '...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
