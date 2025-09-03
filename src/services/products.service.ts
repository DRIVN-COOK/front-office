import { api } from '@drivn-cook/shared'

export type Product = {
  id: string
  name: string
  description?: string
  price?: number
  imageUrl?: string
}

export async function listProducts(params?: Record<string, any>) {
  // public
  const { data } = await api.get<Product[]>('/products', { params })
  return data
}

export async function getProduct(id: string) {
  // public
  const { data } = await api.get<Product>(`/products/${id}`)
  return data
}
