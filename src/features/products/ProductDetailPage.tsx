import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CATEGORIES } from '../../lib/products'
import { useProducts } from './useProducts'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../lib/supabaseClient'

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Disponible', classes: 'bg-green-100 text-green-700' },
  RESERVED: { label: 'Réservé', classes: 'bg-orange-100 text-orange-700' },
  SOLD: { label: 'Vendu', classes: 'bg-gray-100 text-gray-500' },
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, loading } = useProducts()
  const { user } = useAuth()
  const [reserving, setReserving] = useState(false)
  const [reserved, setReserved] = useState(false)
  const [reserveError, setReserveError] = useState<string | null>(null)

  const product = products.find((p) => p.id === id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-medium text-gray-700">Produit introuvable</p>
        <Link to="/" className="mt-4 text-orange-500 font-medium">
          Retour au catalogue
        </Link>
      </div>
    )
  }

  const status = STATUS_CONFIG[product.status]
  const category = CATEGORIES.find((c) => c.id === product.category)
  const isAvailable = product.status === 'AVAILABLE'

  async function handleReserve() {
    if (!user) {
      navigate('/connexion')
      return
    }
    setReserving(true)
    setReserveError(null)
    const { error } = await supabase
      .from('reservations')
      .insert({ product_id: product!.id, user_id: user.id })
    setReserving(false)
    if (error) {
      setReserveError(error.message)
      return
    }
    setReserved(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800 text-lg"
            aria-label="Retour"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900">Détail de l'article</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="relative">
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-72 object-cover"
            />
            {!isAvailable && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="bg-white text-gray-800 font-semibold px-3 py-1 rounded-full text-sm">
                  {status.label}
                </span>
              </div>
            )}
          </div>

          <div className="p-5">
            {category && (
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {category.emoji} {category.label}
              </span>
            )}
            <h1 className="text-xl font-bold text-gray-900 mt-1">{product.title}</h1>
            <p className="text-2xl font-bold text-orange-500 mt-2">{product.price} €</p>

            <div className="flex items-center gap-2 mt-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
                {status.label}
              </span>
              <span className="text-xs text-gray-400">Publié le {product.createdAt}</span>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mt-4">{product.description}</p>

            {reserveError && <p className="text-xs text-red-500 mt-3">{reserveError}</p>}

            <button
              disabled={!isAvailable || reserving || reserved}
              onClick={handleReserve}
              className={`w-full mt-6 py-3 rounded-full font-semibold text-sm transition-colors ${
                isAvailable && !reserved
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {reserved
                ? 'Réservation envoyée ✓'
                : reserving
                  ? '...'
                  : isAvailable
                    ? 'Réserver cet article'
                    : status.label}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
