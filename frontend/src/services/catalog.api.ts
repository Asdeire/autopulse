import { http } from './http'
import type { Category, Product, ProductsQuery } from '../types/catalog'

export async function getCategories() {
  const res = await http.get<Category[]>('/categories')
  return res.data
}

export async function getProducts(query: ProductsQuery = {}) {
  const res = await http.get<Product[]>('/products', { params: query })
  return res.data
}

export async function getProductById(id: number, query?: Pick<ProductsQuery, 'vehicleSpecId' | 'usePrimaryVehicle'>) {
  const res = await http.get<Product>(`/products/${id}`, { params: query })
  return res.data
}

