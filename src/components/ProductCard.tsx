import { Link } from 'react-router-dom'
import type { Product } from '../lib/products'

const STATUS_CONFIG = {
  AVAILABLE: { label: 'Disponible', classes: 'bg-green-100 text-green-700' },
  RESERVED: { label: 'Réservé', classes: 'bg-orange-100 text-orange-700' },
  SOLD: { label: 'Vendu', classes: 'bg-gray-100 text-gray-500' },
}

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const status = STATUS_CONFIG[product.status]

  return (
    <Link
      to={`/produit/${product.id}`}
      className="block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-100"
    >
      <div className="relative">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-44 object-cover"
        />
        {product.status !== 'AVAILABLE' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-semibold px-3 py-1 rounded-full text-sm">
              {status.label}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
          {product.title}
        </p>
        <p className="text-lg font-bold text-orange-500">{product.price} €</p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.classes}`}>
            {status.label}
          </span>
          <span className="text-xs text-gray-400">{product.createdAt}</span>
        </div>
      </div>
    </Link>
  )
}
