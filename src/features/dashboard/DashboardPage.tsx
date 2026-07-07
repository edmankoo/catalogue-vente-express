import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MOCK_PRODUCTS, CATEGORIES, type Product } from '../../lib/mockData'
import { MOCK_RESERVATIONS, type ReservationStatus } from '../../lib/mockReservations'

type Tab = 'produits' | 'reservations'

const PRODUCT_STATUS_CONFIG = {
  AVAILABLE: { label: 'Disponible', classes: 'bg-green-100 text-green-700' },
  RESERVED: { label: 'Réservé', classes: 'bg-orange-100 text-orange-700' },
  SOLD: { label: 'Vendu', classes: 'bg-gray-100 text-gray-500' },
}

const RESERVATION_STATUS_CONFIG: Record<ReservationStatus, { label: string; classes: string }> = {
  NEW: { label: 'Nouvelle', classes: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'Contacté', classes: 'bg-purple-100 text-purple-700' },
  NEGOTIATION: { label: 'Négociation', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmée', classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulée', classes: 'bg-gray-100 text-gray-500' },
  EXPIRED: { label: 'Expirée', classes: 'bg-red-100 text-red-600' },
}

let nextId = 1000

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('produits')
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[1]?.id ?? '')

  const stats = {
    total: products.length,
    available: products.filter((p) => p.status === 'AVAILABLE').length,
    reserved: products.filter((p) => p.status === 'RESERVED').length,
    sold: products.filter((p) => p.status === 'SOLD').length,
  }

  function handleAddProduct(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !price) return
    const newProduct: Product = {
      id: String(nextId++),
      title: title.trim(),
      price: Number(price),
      stock: 1,
      status: 'AVAILABLE',
      category,
      image: 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Nouveau+produit',
      description: '',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setProducts((prev) => [newProduct, ...prev])
    setTitle('')
    setPrice('')
    setShowForm(false)
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <span className="font-bold text-gray-900 text-lg leading-none">Espace vendeur</span>
          </div>
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Retour au catalogue
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">Total produits</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">Réservés</p>
            <p className="text-2xl font-bold text-orange-500">{stats.reserved}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">Vendus</p>
            <p className="text-2xl font-bold text-gray-500">{stats.sold}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('produits')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'produits' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Produits
          </button>
          <button
            onClick={() => setTab('reservations')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === 'reservations' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Réservations
          </button>
        </div>

        {tab === 'produits' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Catalogue produits</p>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full transition-colors"
              >
                {showForm ? 'Annuler' : '+ Ajouter un produit'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleAddProduct} className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs font-medium text-gray-500">Titre</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs font-medium text-gray-500">Prix (€)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div className="w-48">
                  <label className="text-xs font-medium text-gray-500">Rubrique</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-2 font-medium">Produit</th>
                    <th className="px-4 py-2 font-medium">Prix</th>
                    <th className="px-4 py-2 font-medium">Stock</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const status = PRODUCT_STATUS_CONFIG[p.status]
                    return (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5 flex items-center gap-2">
                          <img src={p.image} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                          <span className="text-gray-800 font-medium line-clamp-1">{p.title}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-700">{p.price} €</td>
                        <td className="px-4 py-2.5 text-gray-500">{p.stock}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {products.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Aucun produit pour le moment.</p>
              )}
            </div>
            <p className="text-xs text-gray-400 px-4 py-3">
              Données locales à cette session — la vraie gestion arrivera avec le branchement Supabase.
            </p>
          </div>
        )}

        {tab === 'reservations' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Produit</th>
                    <th className="px-4 py-2 font-medium">Statut</th>
                    <th className="px-4 py-2 font-medium">Expire le</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_RESERVATIONS.map((r) => {
                    const product = products.find((p) => p.id === r.productId)
                    const status = RESERVATION_STATUS_CONFIG[r.status]
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <p className="text-gray-800 font-medium">{r.clientName}</p>
                          <p className="text-xs text-gray-400">{r.clientPhone}</p>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 line-clamp-1">{product?.title ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{r.expiresAt}</td>
                        <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                          <button className="text-xs text-gray-500 hover:text-gray-800 font-medium">Contacter</button>
                          <button className="text-xs text-green-600 hover:text-green-800 font-medium">Valider</button>
                          <button className="text-xs text-red-500 hover:text-red-700 font-medium">Annuler</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 px-4 py-3">
              Actions non actives pour l'instant — elles seront branchées à Supabase (auto-expiration à 72h incluse).
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
