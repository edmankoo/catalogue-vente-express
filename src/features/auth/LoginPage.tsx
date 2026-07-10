import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

type Mode = 'connexion' | 'inscription'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('connexion')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)

    if (error) {
      setError(error)
      return
    }
    setForgotSent(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedPassword = password.trim()

    if (mode === 'inscription' && trimmedPassword !== passwordConfirm.trim()) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    let result: { error: string | null }
    try {
      result =
        mode === 'connexion'
          ? await signIn(email, trimmedPassword)
          : await signUp(email, trimmedPassword, { firstName, lastName, phone })
    } catch {
      setLoading(false)
      setError('Connexion au serveur impossible. Réessaie.')
      return
    }

    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (mode === 'inscription') {
      setSignupDone(true)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏷️</span>
        <span className="font-bold text-gray-900 text-lg leading-none">
          Vente<span className="text-orange-500">Express</span>
        </span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => {
              setMode('connexion')
              setError(null)
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'connexion'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => {
              setMode('inscription')
              setError(null)
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'inscription'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Inscription
          </button>
        </div>

        {mode === 'inscription' && signupDone ? (
          <div className="p-5 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold text-gray-800">Compte créé !</p>
            <p className="text-sm text-gray-500 mt-1">
              Vérifie ta boîte mail si une confirmation est demandée, puis connecte-toi.
            </p>
            <button
              onClick={() => {
                setMode('connexion')
                setSignupDone(false)
              }}
              className="mt-4 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              Aller à la connexion
            </button>
          </div>
        ) : mode === 'connexion' && forgotMode ? (
          forgotSent ? (
            <div className="p-5 text-center">
              <p className="text-3xl mb-2">📩</p>
              <p className="font-semibold text-gray-800">Email envoyé !</p>
              <p className="text-sm text-gray-500 mt-1">
                Si un compte existe pour {email || 'cet email'}, un lien de réinitialisation vient d'être envoyé.
              </p>
              <button
                onClick={() => {
                  setForgotMode(false)
                  setForgotSent(false)
                  setError(null)
                }}
                className="mt-4 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form className="p-5 flex flex-col gap-3" onSubmit={handleForgotSubmit}>
              <p className="text-sm text-gray-500">
                Indique ton email, on t'envoie un lien pour choisir un nouveau mot de passe.
              </p>

              <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60"
              >
                {loading ? '...' : 'Envoyer le lien'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode(false)
                  setError(null)
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← Retour à la connexion
              </button>
            </form>
          )
        ) : (
          <form className="p-5 flex flex-col gap-3" onSubmit={handleSubmit}>
            {mode === 'inscription' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500">Prénom</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-gray-500">Nom</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
            )}

            {mode === 'inscription' && (
              <div>
                <label className="text-xs font-medium text-gray-500">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-500">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">Mot de passe</label>
                {mode === 'inscription' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? 'Masquer' : 'Afficher'}
                  </button>
                )}
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {mode === 'connexion' && (
              <button
                type="button"
                onClick={() => {
                  setForgotMode(true)
                  setError(null)
                }}
                className="text-xs text-gray-400 hover:text-gray-600 text-left -mt-1"
              >
                Mot de passe oublié ?
              </button>
            )}

            {mode === 'inscription' && (
              <div>
                <label className="text-xs font-medium text-gray-500">Confirmer le mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-500 -mt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60"
            >
              {loading ? '...' : mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>

      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 mt-4">
        ← Retour au catalogue
      </Link>
    </div>
  )
}
