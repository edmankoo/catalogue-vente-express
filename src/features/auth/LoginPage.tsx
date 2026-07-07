import { useState } from 'react'
import { Link } from 'react-router-dom'

type Mode = 'connexion' | 'inscription'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('connexion')

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
            onClick={() => setMode('connexion')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'connexion'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('inscription')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              mode === 'inscription'
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Inscription
          </button>
        </div>

        <form className="p-5 flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          {mode === 'inscription' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">Prénom</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-500">Nom</label>
                <input
                  type="text"
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
                className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Mot de passe</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors"
          >
            {mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-1">
            La connexion réelle sera activée à l'étape suivante (branchement Supabase).
          </p>
        </form>
      </div>

      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 mt-4">
        ← Retour au catalogue
      </Link>
    </div>
  )
}
