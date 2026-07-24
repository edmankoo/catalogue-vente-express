import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import type { Product } from '../../lib/products'

interface ProductRow {
  id: string
  title: string
  description: string
  price: number
  stock: number
  status: Product['status']
  category: string
  image_url: string | null
  image_urls: string[] | null
  created_at: string
}

const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Produit'

function mapRow(row: ProductRow): Product {
  const images = row.image_urls?.length ? row.image_urls : row.image_url ? [row.image_url] : []
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    status: row.status,
    category: row.category,
    image: images[0] ?? PLACEHOLDER_IMAGE,
    images,
    createdAt: row.created_at.slice(0, 10),
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setError(null)
      setProducts((data as ProductRow[]).map(mapRow))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { products, loading, error, refetch }
}
