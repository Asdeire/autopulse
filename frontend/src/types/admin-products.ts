export type AdminProduct = {
  id: number
  title: string
  description: string
  brand: string
  imageUrl: string
  price: number
  categoryId: number
  category: {
    id: number
    name: string
  }
  vehicleSpecIds: number[]
  createdAt: string
  updatedAt: string
}

export type AdminProductInput = {
  title: string
  description: string
  brand: string
  price: number
  categoryId: number
  imageUrl?: string | null
  imageFile?: File | null
  vehicleSpecIds: number[]
}
