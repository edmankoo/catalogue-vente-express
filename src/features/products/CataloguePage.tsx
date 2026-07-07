import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, MOCK_PRODUCTS } from '../../lib/mockData'
import ProductCard from '../../components/ProductCard'

export default function CataloguePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      const matchCat = activeCategory === 'all' || p.category === activeCategory
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [activeCategory, search])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: MOCK_PRODUCTS.length }
    MOCK_PRODUCTS.forEach((p) => {
      map[p.category] = (map[p.category] ?? 0) + 1
    })
    return map
  }, [])

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

          <Link
            to="/connexion"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            Connexion
          </Link>
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
        {filtered.length > 0 ? (
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
