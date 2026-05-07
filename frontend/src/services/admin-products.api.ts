import { http } from './http'
import type { AdminProduct, AdminProductInput } from '../types/admin-products'

export async function getAdminProducts(search?: string) {
  const res = await http.get<AdminProduct[]>('/admin/products', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  })
  return res.data
}

export async function getAdminProductById(id: number) {
  const res = await http.get<AdminProduct>(`/admin/products/${id}`)
  return res.data
}

export async function createAdminProduct(input: AdminProductInput) {
  const res = await http.post<AdminProduct>('/admin/products', input)
  return res.data
}

export async function updateAdminProduct(id: number, input: AdminProductInput) {
  const res = await http.put<AdminProduct>(`/admin/products/${id}`, input)
  return res.data
}

export async function deleteAdminProduct(id: number) {
  await http.delete(`/admin/products/${id}`)
}
