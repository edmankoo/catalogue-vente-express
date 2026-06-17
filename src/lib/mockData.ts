export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'

export interface Product {
  id: string
  title: string
  price: number
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

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'iPhone 13 Pro — 256 Go',
    price: 550,
    status: 'AVAILABLE',
    category: 'electronique',
    image: 'https://placehold.co/400x300/e8f0fe/4285f4?text=iPhone+13+Pro',
    description: 'Très bon état, batterie 89%, avec chargeur et boîte d\'origine.',
    createdAt: '2026-06-10',
  },
  {
    id: '2',
    title: 'Canapé 3 places tissu gris',
    price: 180,
    status: 'RESERVED',
    category: 'maison',
    image: 'https://placehold.co/400x300/f3e8ff/9333ea?text=Canapé+gris',
    description: 'Canapé confortable, quelques traces d\'usure, très bon confort.',
    createdAt: '2026-06-08',
  },
  {
    id: '3',
    title: 'Veste en cuir noir — Taille M',
    price: 65,
    status: 'AVAILABLE',
    category: 'vetements',
    image: 'https://placehold.co/400x300/fef3c7/d97706?text=Veste+cuir',
    description: 'Veste en cuir synthétique, peu portée, taille M.',
    createdAt: '2026-06-12',
  },
  {
    id: '4',
    title: 'Perceuse Bosch sans fil',
    price: 85,
    status: 'AVAILABLE',
    category: 'outillage',
    image: 'https://placehold.co/400x300/dcfce7/16a34a?text=Perceuse+Bosch',
    description: '18V, 2 batteries, chargeur inclus. Très bon état.',
    createdAt: '2026-06-05',
  },
  {
    id: '5',
    title: 'Machine à café Nespresso',
    price: 45,
    status: 'SOLD',
    category: 'petit-electromenager',
    image: 'https://placehold.co/400x300/fee2e2/dc2626?text=Nespresso',
    description: 'Fonctionne parfaitement, détartrée récemment.',
    createdAt: '2026-06-01',
  },
  {
    id: '6',
    title: 'Vélo de route 54cm — Shimano',
    price: 320,
    status: 'AVAILABLE',
    category: 'sport',
    image: 'https://placehold.co/400x300/e0f2fe/0284c7?text=Vélo+route',
    description: 'Cadre aluminium, 21 vitesses, très bon état général.',
    createdAt: '2026-06-14',
  },
  {
    id: '7',
    title: 'MacBook Air M1 — 8 Go / 256 Go',
    price: 750,
    status: 'AVAILABLE',
    category: 'informatique',
    image: 'https://placehold.co/400x300/f0fdf4/22c55e?text=MacBook+Air',
    description: 'Excellent état, batterie 95%, chargeur inclus.',
    createdAt: '2026-06-13',
  },
  {
    id: '8',
    title: 'LEGO Technic — Camion 42128',
    price: 55,
    status: 'AVAILABLE',
    category: 'jouets',
    image: 'https://placehold.co/400x300/fff7ed/ea580c?text=LEGO+Technic',
    description: 'Complet, boîte d\'origine en bon état.',
    createdAt: '2026-06-11',
  },
  {
    id: '9',
    title: 'Lave-linge Samsung 8kg',
    price: 230,
    status: 'RESERVED',
    category: 'electromenager',
    image: 'https://placehold.co/400x300/f8fafc/64748b?text=Lave-linge',
    description: '3 ans, fonctionne parfaitement, moteur brushless.',
    createdAt: '2026-06-07',
  },
  {
    id: '10',
    title: 'Jantes alu 205/55 R16 — x4',
    price: 140,
    status: 'AVAILABLE',
    category: 'auto',
    image: 'https://placehold.co/400x300/fafaf9/737373?text=Jantes+alu',
    description: '4 jantes avec pneus hiver, bon état, sans crevaison.',
    createdAt: '2026-06-09',
  },
  {
    id: '11',
    title: 'Service vaisselle 12 pièces',
    price: 30,
    status: 'AVAILABLE',
    category: 'maison',
    image: 'https://placehold.co/400x300/fdf4ff/c026d3?text=Vaisselle',
    description: 'Blanc, quelques légères rayures, complet.',
    createdAt: '2026-06-06',
  },
  {
    id: '12',
    title: 'Sneakers Nike Air Max 90 — 42',
    price: 70,
    status: 'AVAILABLE',
    category: 'vetements',
    image: 'https://placehold.co/400x300/eff6ff/3b82f6?text=Nike+Air+Max',
    description: 'Portées 3 fois, comme neuves, taille 42.',
    createdAt: '2026-06-15',
  },
]
