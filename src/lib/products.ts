export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'

export interface Product {
  id: string
  title: string
  price: number
  stock: number
  status: ProductStatus
  category: string
  image: string
  description: string
  createdAt: string
}

export const CATEGORIES = [
  { id: 'all', label: 'Tout voir', emoji: '🏠' },
  { id: 'vetements', label: 'Vêtements / Mode', emoji: '👗' },
  { id: 'electronique', label: 'Électronique', emoji: '📱' },
  { id: 'maison', label: 'Maison / Déco', emoji: '🛋️' },
  { id: 'petit-electromenager', label: 'Petit électroménager', emoji: '☕' },
  { id: 'electromenager', label: 'Électroménager', emoji: '🫧' },
  { id: 'outillage', label: 'Outillage', emoji: '🔧' },
  { id: 'jouets', label: 'Jouets / Enfants', emoji: '🧸' },
  { id: 'sport', label: 'Sport / Loisirs', emoji: '⚽' },
  { id: 'auto', label: 'Auto / Moto', emoji: '🚗' },
  { id: 'informatique', label: 'Informatique', emoji: '💻' },
  { id: 'autres', label: 'Autres', emoji: '📦' },
]
