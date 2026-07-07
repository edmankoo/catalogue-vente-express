import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../../lib/products'
import ProductCard from '../../components/ProductCard'
import { useAuth } from '../auth/AuthContext'
import { useProducts } from './useProducts'

export default function CataloguePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { products, loading, error } = useProducts()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [products, activeCategory, search])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length }
    products.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + 1
    })
    return map
  }, [products])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🏷️</span>
            <span className="font-bold text-gray-900 text-lg leading-none">
              Vente<span className="text-orange-500">Express</span>
            </span>
          </div>

          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="search"
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition-colors"
            />
          </div>

          {user ? (
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-sm text-gray-600 hidden sm:inline">
                Bonjour {profile?.first_name || 'toi'}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <Link
              to="/connexion"
              className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
            >
              Connexion
            </Link>
          )}
        </div>

        {/* Barre de catégories */}
        <div className="border-t border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="max-w-5xl mx-auto px-4 py-2 flex gap-2 w-max min-w-full">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${activeCategory === cat.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {counts[cat.id] !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat.id ? 'bg-orange-400 text-white' : 'bg-white text-gray-500'
                  }`}>
                    {counts[cat.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Titre de section */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-base font-semibold text-gray-700">
            {activeCategory === 'all'
              ? 'Tous les articles'
              : CATEGORIES.find((c) => c.id === activeCategory)?.label}
            <span className="ml-2 text-sm font-normal text-gray-400">
              {filtered.length} article{filtered.length > 1 ? 's' : ''}
            </span>
          </h1>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-orange-400">
            <option>Plus récents</option>
            <option>Prix croissant</option>
            <option>Prix décroissant</option>
          </select>
        </div>

        {/* Grille de produits */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">⏳</p>
            <p className="font-medium">Chargement du catalogue...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-medium">Impossible de charger les produits</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Aucun article dans cette rubrique</p>
            <p className="text-sm mt-1">Revenez bientôt !</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/admin" className="text-xs text-gray-300 hover:text-gray-500">
            Espace vendeur
          </Link>
        </div>
      </main>
    </div>
  )
}
