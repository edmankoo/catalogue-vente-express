import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CATEGORIES } from '../../lib/products'
import type { ReservationStatus } from '../../lib/reservationTypes'
import { useAuth } from '../auth/AuthContext'
import { useProducts } from '../products/useProducts'
import { supabase } from '../../lib/supabaseClient'

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

const PENDING_STATUSES: ReservationStatus[] = ['NEW', 'CONTACTED', 'NEGOTIATION']

// Indicatif utilisé pour construire le lien WhatsApp quand le client a saisi
// son numéro au format local (06 12 34 56 78).
const DEFAULT_COUNTRY_CODE = '33'

interface ReservationRow {
  id: string
  product_id: string
  status: ReservationStatus
  reserved_at: string
  expires_at: string
  product_title: string | null
  client_first_name: string | null
  client_last_name: string | null
  client_phone: string | null
  client_email: string | null
}

function toWhatsAppNumber(phone: string): string | null {
  const trimmed = phone.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 6) return null
  if (trimmed.startsWith('+')) return digits
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0')) return DEFAULT_COUNTRY_CODE + digits.slice(1)
  return digits
}

function formatExpiry(expiresAt: string): { label: string; urgent: boolean } {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return { label: 'Délai dépassé', urgent: true }
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return { label: `Expire dans ${Math.max(1, Math.round(ms / 60_000))} min`, urgent: true }
  if (hours < 24) return { label: `Expire dans ${hours} h`, urgent: true }
  return { label: `Expire dans ${Math.floor(hours / 24)} j`, urgent: false }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading, profileLoading } = useAuth()
  const { products, loading: productsLoading, refetch } = useProducts()

  const [tab, setTab] = useState<Tab>('produits')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[1]?.id ?? '')
  const [description, setDescription] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [reservationsLoading, setReservationsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true)
    const { data } = await supabase.rpc('get_admin_reservations')
    setReservations((data as ReservationRow[]) ?? [])
    setReservationsLoading(false)
  }, [])

  // Chargées dès l'arrivée sur le dashboard : le compteur de l'onglet doit
  // être visible sans avoir à ouvrir la rubrique.
  useEffect(() => {
    if (profile?.role === 'ADMIN') fetchReservations()
  }, [profile?.role, fetchReservations])

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    )
  }

  if (!user || profile?.role !== 'ADMIN') {
    return <Navigate to="/connexion" replace />
  }

  const stats = {
    total: products.length,
    available: products.filter((p) => p.status === 'AVAILABLE').length,
    reserved: products.filter((p) => p.status === 'RESERVED').length,
    sold: products.filter((p) => p.status === 'SOLD').length,
  }

  const productById = new Map(products.map((p) => [p.id, p]))
  const pendingCount = reservations.filter((r) => PENDING_STATUSES.includes(r.status)).length

  // Les réservations à traiter passent devant, le reste garde l'ordre
  // antéchronologique renvoyé par la base.
  const sortedReservations = [...reservations].sort((a, b) => {
    const aPending = PENDING_STATUSES.includes(a.status) ? 0 : 1
    const bPending = PENDING_STATUSES.includes(b.status) ? 0 : 1
    return aPending - bPending
  })

  async function handleCopyPhone(reservation: ReservationRow) {
    if (!reservation.client_phone) return
    await navigator.clipboard.writeText(reservation.client_phone)
    setCopiedId(reservation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function resetForm() {
    setTitle('')
    setPrice('')
    setDescription('')
    setImageFiles([])
    setExistingImages([])
    setEditingId(null)
    setShowForm(false)
  }

  function handleStartEdit(p: (typeof products)[number]) {
    setEditingId(p.id)
    setTitle(p.title)
    setPrice(String(p.price))
    setCategory(p.category)
    setDescription(p.description)
    setExistingImages(p.images)
    setImageFiles([])
    setFormError(null)
    setShowForm(true)
  }

  function handleRemoveExistingImage(url: string) {
    setExistingImages((imgs) => imgs.filter((i) => i !== url))
  }

  function handleRemoveNewImage(index: number) {
    setImageFiles((files) => files.filter((_, i) => i !== index))
  }

  async function handleSubmitProduct(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !price) return
    setSaving(true)
    setFormError(null)
    try {
      const uploadedUrls: string[] = []
      for (const file of imageFiles) {
        const path = `${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file)
        if (uploadError) {
          setFormError(uploadError.message)
          return
        }
        uploadedUrls.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }

      const images = [...existingImages, ...uploadedUrls]
      const imageUrl = images[0] ?? 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Nouveau+produit'

      const payload = {
        title: title.trim(),
        price: Number(price),
        category,
        image_url: imageUrl,
        image_urls: images,
        description: description.trim(),
      }

      if (editingId) {
        await supabase.from('products').update(payload).eq('id', editingId)
      } else {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({ ...payload, stock: 1, status: 'AVAILABLE' })
          .select()
          .single()

        if (newProduct) {
          await supabase.functions.invoke('send-product-notifications', {
            body: {
              product_id: newProduct.id,
              title: newProduct.title,
              price: newProduct.price,
            },
          })
        }
      }
    } catch {
      setFormError('Connexion au serveur impossible. Réessaie.')
      return
    } finally {
      setSaving(false)
    }
    resetForm()
    refetch()
  }

  async function handleDelete(id: string) {
    await supabase.from('products').delete().eq('id', id)
    refetch()
  }

  async function handleSetStatus(reservation: ReservationRow, status: ReservationStatus) {
    await supabase.from('reservations').update({ status }).eq('id', reservation.id)
    fetchReservations()
  }

  async function handleValidate(reservation: ReservationRow) {
    await supabase.from('reservations').update({ status: 'CONFIRMED' }).eq('id', reservation.id)
    await supabase.from('products').update({ status: 'SOLD' }).eq('id', reservation.product_id)
    fetchReservations()
    refetch()
  }

  async function handleCancel(reservation: ReservationRow) {
    await supabase.from('reservations').update({ status: 'CANCELLED' }).eq('id', reservation.id)
    await supabase.from('products').update({ status: 'AVAILABLE' }).eq('id', reservation.product_id)
    fetchReservations()
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30 pt-safe">
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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === 'reservations' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Réservations
            {pendingCount > 0 && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[1.25rem] ${
                  tab === 'reservations' ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {tab === 'produits' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Catalogue produits</p>
              <button
                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full transition-colors"
              >
                {showForm ? 'Annuler' : '+ Ajouter un produit'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmitProduct} className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-end">
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
                <div className="w-full">
                  <label className="text-xs font-medium text-gray-500">Photos</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                    className="w-full mt-1 text-xs text-gray-500 file:mr-2 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:text-xs"
                  />
                  {(existingImages.length > 0 || imageFiles.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {existingImages.map((url) => (
                        <div key={url} className="relative">
                          <img src={url} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(url)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-xs leading-none flex items-center justify-center"
                            aria-label="Retirer cette photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {imageFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-xs leading-none flex items-center justify-center"
                            aria-label="Retirer cette photo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Décris l'état, les dimensions, les particularités du produit..."
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400 resize-y"
                  />
                </div>
                {formError && <p className="text-xs text-red-500 w-full">{formError}</p>}
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? '...' : editingId ? 'Mettre à jour' : 'Enregistrer'}
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
                        <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="text-xs text-gray-500 hover:text-gray-800 font-medium"
                          >
                            Modifier
                          </button>
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
              {!productsLoading && products.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">Aucun produit pour le moment.</p>
              )}
            </div>
          </div>
        )}

        {tab === 'reservations' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {pendingCount > 0
                  ? `${pendingCount} réservation${pendingCount > 1 ? 's' : ''} à traiter`
                  : 'Aucune réservation à traiter'}
              </p>
              <button
                onClick={fetchReservations}
                className="text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                ↻ Actualiser
              </button>
            </div>

            {reservationsLoading && (
              <p className="text-center text-gray-400 py-12 text-sm">Chargement des réservations...</p>
            )}

            {!reservationsLoading && sortedReservations.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-100 text-center py-14">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm text-gray-400">Aucune réservation pour le moment.</p>
              </div>
            )}

            {sortedReservations.map((r) => {
              const status = RESERVATION_STATUS_CONFIG[r.status]
              const clientName =
                [r.client_first_name, r.client_last_name].filter(Boolean).join(' ') ||
                r.client_email ||
                'Client'
              const isPending = PENDING_STATUSES.includes(r.status)
              const product = productById.get(r.product_id)
              const expiry = formatExpiry(r.expires_at)
              const whatsapp = r.client_phone ? toWhatsAppNumber(r.client_phone) : null

              return (
                <article
                  key={r.id}
                  className={`bg-white rounded-xl border overflow-hidden ${
                    isPending ? 'border-orange-200 shadow-sm' : 'border-gray-100'
                  }`}
                >
                  {/* Le client : c'est l'information que le vendeur vient chercher */}
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold shrink-0">
                      {initialsOf(clientName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{clientName}</p>
                        {isPending ? (
                          <select
                            value={r.status}
                            onChange={(e) => handleSetStatus(r, e.target.value as ReservationStatus)}
                            className={`text-xs font-medium pl-2 pr-1 py-1 rounded-full border-0 cursor-pointer shrink-0 ${status.classes}`}
                          >
                            <option value="NEW">Nouvelle</option>
                            <option value="CONTACTED">Contacté</option>
                            <option value="NEGOTIATION">Négociation</option>
                          </select>
                        ) : (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${status.classes}`}
                          >
                            {status.label}
                          </span>
                        )}
                      </div>

                      {r.client_phone ? (
                        <a
                          href={`tel:${r.client_phone.replace(/\s/g, '')}`}
                          className="mt-1 inline-block text-xl font-bold text-gray-900 tracking-tight hover:text-orange-600 transition-colors"
                        >
                          {r.client_phone}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-gray-400 italic">Aucun numéro renseigné</p>
                      )}

                      {r.client_email && (
                        <a
                          href={`mailto:${r.client_email}`}
                          className="block text-xs text-gray-400 hover:text-gray-600 truncate"
                        >
                          {r.client_email}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Le produit concerné */}
                  <div className="px-4 pb-3 flex items-center gap-3">
                    <img
                      src={product?.image ?? 'https://placehold.co/100x100/f3f4f6/9ca3af?text=Produit'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700 truncate">{r.product_title ?? 'Produit supprimé'}</p>
                      <p className="text-xs text-gray-400">
                        {product ? `${product.price} € · ` : ''}
                        Réservé le {formatDateTime(r.reserved_at)}
                      </p>
                    </div>
                    {isPending && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                          expiry.urgent ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {expiry.label}
                      </span>
                    )}
                  </div>

                  {/* Actions de contact et de suivi */}
                  <div className="border-t border-gray-100 px-4 py-2.5 flex flex-wrap items-center gap-2">
                    {r.client_phone && (
                      <>
                        <a
                          href={`tel:${r.client_phone.replace(/\s/g, '')}`}
                          className="text-xs font-medium bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full transition-colors"
                        >
                          📞 Appeler
                        </a>
                        {whatsapp && (
                          <a
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-full transition-colors"
                          >
                            💬 WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => handleCopyPhone(r)}
                          className="text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {copiedId === r.id ? '✓ Copié' : 'Copier'}
                        </button>
                      </>
                    )}
                    {isPending && (
                      <div className="ml-auto flex items-center gap-3">
                        <button
                          onClick={() => handleValidate(r)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Valider la vente
                        </button>
                        <button
                          onClick={() => handleCancel(r)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
