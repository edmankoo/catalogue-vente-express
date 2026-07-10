import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import type { ReservationStatus } from '../../lib/reservationTypes'

const STATUS_CONFIG: Record<ReservationStatus, { label: string; classes: string }> = {
  NEW: { label: 'En attente de confirmation', classes: 'bg-blue-100 text-blue-700' },
  CONTACTED: { label: 'Le vendeur t’a contacté', classes: 'bg-purple-100 text-purple-700' },
  NEGOTIATION: { label: 'En discussion', classes: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmée', classes: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulée', classes: 'bg-gray-100 text-gray-500' },
  EXPIRED: { label: 'Expirée', classes: 'bg-red-100 text-red-600' },
}

interface ReservationRow {
  id: string
  status: ReservationStatus
  reserved_at: string
  expires_at: string
  products: { id: string; title: string; price: number; image_url: string | null } | null
}

export default function MyReservationsPage() {
  const { user, loading: authLoading } = useAuth()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('reservations')
      .select('id, status, reserved_at, expires_at, products(id, title, price, image_url)')
      .eq('user_id', user.id)
      .order('reserved_at', { ascending: false })
      .then(({ data }) => {
        setReservations((data as unknown as ReservationRow[]) ?? [])
        setLoading(false)
      })
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/connexion" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-500 hover:text-gray-800 text-lg" aria-label="Retour">
            ←
          </Link>
          <span className="font-semibold text-gray-900">Mes réservations</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement...</div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📦</p>
            <p className="font-medium">Aucune réservation pour le moment</p>
            <Link to="/" className="mt-4 inline-block text-orange-500 font-medium">
              Voir le catalogue
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reservations.map((r) => {
              const status = STATUS_CONFIG[r.status]
              return (
                <Link
                  key={r.id}
                  to={r.products ? `/produit/${r.products.id}` : '#'}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-orange-200 transition-colors"
                >
                  <img
                    src={r.products?.image_url ?? 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Produit'}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {r.products?.title ?? 'Produit supprimé'}
                    </p>
                    <p className="text-sm text-orange-500 font-semibold">{r.products?.price} €</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${status.classes}`}>
                    {status.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
