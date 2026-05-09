import { http } from './http'
import type { AdminProduct, AdminProductInput } from '../types/admin-products'

function toFormData(input: AdminProductInput) {
  const formData = new FormData()
  formData.append('title', input.title)
  formData.append('description', input.description)
  formData.append('brand', input.brand)
  formData.append('price', String(input.price))
  formData.append('categoryId', String(input.categoryId))
  formData.append('vehicleSpecIds', JSON.stringify(input.vehicleSpecIds))

  if (typeof input.imageUrl === 'string') {
    formData.append('imageUrl', input.imageUrl)
  }

  if (input.imageFile) {
    formData.append('image', input.imageFile)
  }

  return formData
}

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
  const res = await http.post<AdminProduct>('/admin/products', toFormData(input))
  return res.data
}

export async function updateAdminProduct(id: number, input: AdminProductInput) {
  const res = await http.put<AdminProduct>(`/admin/products/${id}`, toFormData(input))
  return res.data
}

export async function deleteAdminProduct(id: number) {
  await http.delete(`/admin/products/${id}`)
}
